import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Sector } from 'recharts';
import { ArrowUpRight, ArrowDownLeft, Calendar, HeartPulse, Info } from 'lucide-react';
import { useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import ForwardInsights from './forward-insights';

const spendingData = [
  { name: 'Food', value: 420, color: '#7c3aed' },
  { name: 'Bills', value: 320, color: '#38bdf8' },
  { name: 'Transport', value: 180, color: '#ea580c' }, // darker orange for contrast
  { name: 'Shopping', value: 260, color: '#f472b6' },
  { name: 'Subscriptions', value: 120, color: '#34d399' },
  { name: 'Other', value: 80, color: '#a3a3a3' },
];
const totalSpent = spendingData.reduce((sum, d) => sum + d.value, 0);

const commitments = [
  { label: 'Rent', amount: 1000, due: 'in 4 days' },
  { label: 'Spotify', amount: 10, due: 'in 2 days' },
  { label: 'Gym', amount: 35, due: 'in 7 days' },
];

const actionableTips = [
  "Try setting a weekly takeout limit of £20 to save more.",
  "Automate your savings to build wealth effortlessly.",
  "Review your subscriptions and cancel unused ones.",
  "Set a monthly budget for shopping and stick to it.",
  "Track your spending daily to avoid surprises at month-end."
];

// Add mock transaction data for demo
const mockTransactions: Record<string, { merchant: string; amount: number; date: string }[]> = {
  Food: [
    { merchant: 'Pret A Manger', amount: 9.2, date: '2024-07-03' },
    { merchant: 'Tesco Groceries', amount: 32.5, date: '2024-07-01' },
    { merchant: 'Starbucks', amount: 4.5, date: '2024-06-29' },
  ],
  Bills: [
    { merchant: 'British Gas', amount: 60, date: '2024-07-02' },
    { merchant: 'Thames Water', amount: 25, date: '2024-07-01' },
    { merchant: 'O2 Mobile', amount: 15, date: '2024-06-28' },
  ],
  Transport: [
    { merchant: 'TFL', amount: 5.6, date: '2024-07-03' },
    { merchant: 'Uber', amount: 12.8, date: '2024-07-01' },
    { merchant: 'Shell Petrol', amount: 25, date: '2024-06-30' },
  ],
  Shopping: [
    { merchant: 'Amazon', amount: 49.99, date: '2024-07-02' },
    { merchant: 'Zara', amount: 35, date: '2024-07-01' },
    { merchant: 'Apple Store', amount: 120, date: '2024-06-29' },
  ],
  Subscriptions: [
    { merchant: 'Netflix', amount: 9.99, date: '2024-07-01' },
    { merchant: 'Spotify', amount: 9.99, date: '2024-06-28' },
    { merchant: 'Notion', amount: 4, date: '2024-06-27' },
  ],
  Other: [
    { merchant: 'Charity', amount: 10, date: '2024-07-01' },
    { merchant: 'Gift Shop', amount: 20, date: '2024-06-30' },
  ],
};

function renderActiveShape(props: any) {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload
  } = props;
  // Calculate the offset for the "lift" effect
  const lift = 18;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + lift * cos;
  const sy = cy + lift * sin;
  return (
    <g>
      <Sector
        cx={sx}
        cy={sy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
        style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.18))', transition: 'all 0.25s cubic-bezier(.4,2,.6,1)' }}
      />
    </g>
  );
}

export default function SmartInsights() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  // For the pie chart
  const pieColors = spendingData.map(d => d.color);
  // For the bar chart (optional, not used in this version)
  // const barData = spendingData.map(d => ({ name: d.name, value: d.value }));

  // Top category change dummy
  const topChange = {
    category: 'Takeout',
    percent: 22,
    up: true,
    icon: '🍔',
  };

  // Financial health dummy
  const healthScore = 76;

  // Actionable insight: randomize on each load
  const insight = useMemo(() => {
    const idx = Math.floor(Math.random() * actionableTips.length);
    return actionableTips[idx];
  }, []);

  // Card click stub
  const handleCardClick = (route: string) => {
    if (navigate) {
      navigate(route);
    } else {
      alert('Stub: would navigate to ' + route);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.section 
      className="w-full mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2 
        className="text-xl font-bold text-gray-800 mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Insights & Actions
      </motion.h2>
      
      {/* Main Insights Grid */}
      <motion.div 
        className="grid grid-cols-12 gap-6 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Upcoming Commitments */}
        <motion.div 
          className="col-span-12 md:col-span-4"
          variants={cardVariants}
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="transition-all duration-300 h-[280px] flex flex-col bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-emerald-700">
                <Calendar className="w-5 h-5 text-emerald-400" aria-label="Calendar" /> Upcoming Commitments
                <span className="ml-2" title="This card lists your next scheduled payments."><Info className="w-4 h-4 text-emerald-400 inline" aria-label="Info" /></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <ul className="space-y-2">
                {commitments.map((c, i) => (
                  <motion.li 
                    key={i} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200/50 shadow-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(16, 185, 129, 0.1)", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)" }}
                  >
                    <span className="text-md font-bold text-emerald-800">{c.label}</span>
                    <span className="text-md font-bold text-emerald-900">£{c.amount}</span>
                    <span className="ml-auto text-sm uppercase tracking-wide text-emerald-600 font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4 inline" aria-label="Due date" /> {c.due}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actionable Insight */}
        <motion.div 
          className="col-span-12 md:col-span-4"
          variants={cardVariants}
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="transition-all duration-300 h-[280px] flex flex-col bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-blue-100 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-blue-700">
                <Info className="w-5 h-5 text-blue-400" aria-label="Info" /> Actionable Insight
                <span className="ml-2" title="A personalized tip to help you save or manage money smarter."><Info className="w-4 h-4 text-blue-400 inline" aria-label="Info" /></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center">
              <motion.div 
                className="flex items-center gap-3 w-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <motion.div 
                  className="bg-white text-blue-700 rounded-xl px-4 py-2 text-sm font-bold shadow-[0_4px_12px_rgb(0,0,0,0.08)] border border-blue-200/50"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                >
                  💡
                </motion.div>
                <div className="text-md text-blue-900 font-medium">{insight}</div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Smart Insights */}
        <motion.div 
          className="col-span-12 md:col-span-4"
          variants={cardVariants}
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="transition-all duration-300 h-[280px] flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-purple-100 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-purple-700">
                <HeartPulse className="w-5 h-5 text-purple-400" aria-label="Heart" /> Smart Insights
                <span className="ml-2" title="AI-powered insights to help you make better financial decisions."><Info className="w-4 h-4 text-purple-400 inline" aria-label="Info" /></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                <motion.div 
                  className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-100/50 to-purple-200/30 border border-purple-200/50 shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(147, 51, 234, 0.1)", boxShadow: "0 4px 12px rgba(147, 51, 234, 0.15)" }}
                >
                  <div className="bg-white text-purple-700 rounded-xl px-2 py-1 text-sm font-bold shadow-[0_2px_8px_rgb(0,0,0,0.06)] border border-purple-200/50 flex-shrink-0">
                    💡
                  </div>
                  <div className="text-sm text-purple-800 font-medium leading-relaxed">
                    Cutting £200 from Entertainment would help you reach your savings goal earlier.
                  </div>
                </motion.div>
                <motion.div 
                  className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-green-100/50 to-green-200/30 border border-green-200/50 shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(34, 197, 94, 0.1)", boxShadow: "0 4px 12px rgba(34, 197, 94, 0.15)" }}
                >
                  <div className="bg-white text-green-700 rounded-xl px-2 py-1 text-sm font-bold shadow-[0_2px_8px_rgb(0,0,0,0.06)] border border-green-200/50 flex-shrink-0">
                    🔥
                  </div>
                  <div className="text-sm text-green-800 font-medium leading-relaxed">
                    You've saved for 3 weeks in a row. Keep the streak alive!
                </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Forward Insights Section */}
      <motion.div 
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
      <ForwardInsights />
      </motion.div>

      {/* View More Button */}
      <motion.div 
        className="flex justify-center mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <motion.button
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-md uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 hover:from-indigo-600 hover:to-purple-700"
          aria-label="View More Insights"
          onClick={() => handleCardClick('/analytics')}
          title="See the full analytics dashboard"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View More Insights
        </motion.button>
      </motion.div>
    </motion.section>
  );
} 