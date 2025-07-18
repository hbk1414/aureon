import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Sector } from 'recharts';
import { ArrowUpRight, ArrowDownLeft, Calendar, HeartPulse, Info } from 'lucide-react';
import { useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

  return (
    <section className="w-full mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2 tracking-tight">Smart Insights</h2>
        <p className="text-gray-500 text-base">See where your money goes, spot trends, and get actionable tips.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr items-stretch flex-wrap" style={{gridAutoRows:'1fr'}}>
        {/* Spending Breakdown */}
        <div
          aria-label="View detailed spending analytics"
          className="group focus:outline-none h-full xl:col-span-2"
          tabIndex={0}
          style={{ textAlign: 'left' }}
          title="See a detailed breakdown of your spending by category. This chart shows your spending by category for the current month. Hover over each slice for details."
        >
          <Card className="transition-all duration-200 min-h-[520px] h-full flex flex-col justify-between backdrop-blur-xl bg-white/80 border border-blue-200 shadow-lg rounded-2xl group-hover:shadow-2xl group-hover:scale-[1.03] focus:ring-2 focus:ring-blue-300 px-8 py-6" aria-label="Spending Breakdown Donut Chart" tabIndex={0}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold text-blue-900">
                <span role="img" aria-label="Pie">📊</span> Spending Breakdown
                <span className="ml-2" title="This chart shows your spending by category for the current month."><Info className="w-4 h-4 text-blue-400 inline" aria-label="Info" /></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center flex-1">
              <div className="w-full h-[min(480px,60vw)] flex items-center justify-center select-none">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart aria-label="Spending Breakdown Donut Chart" role="img">
                    <Pie
                      data={spendingData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      innerRadius={90}
                      paddingAngle={4}
                      minAngle={15}
                      label={function (props: any) {
                        // Place all labels outside the donut
                        const RADIAN = Math.PI / 180;
                        const radius = 180; // distance from center for label
                        const { cx, cy, midAngle, name, value, percent, fill } = props;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        const percentText = `${(percent * 100).toFixed(0)}%`;
                        const valueText = `£${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
                        return (
                          <g>
                            <text
                              x={x}
                              y={y}
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              fontSize={14}
                              fontWeight={600}
                              fill={fill === '#a3a3a3' ? '#374151' : '#1e293b'}
                              style={{ pointerEvents: 'auto', cursor: 'pointer', userSelect: 'none' }}
                            >
                              {name}: {valueText} <tspan fontWeight={400} fill="#64748b">({percentText})</tspan>
                            </text>
                          </g>
                        );
                      }}
                      labelLine={true}
                      isAnimationActive={false}
                      onClick={(_, idx) => {
                        console.log('Clicked segment:', spendingData[idx]);
                        setSelectedCategory(spendingData[idx]);
                        setModalOpen(true);
                      }}
                      activeIndex={activeIndex}
                      onMouseEnter={(_, idx) => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(-1)}
                      activeShape={renderActiveShape}
                      cursor="pointer"
                    >
                      {spendingData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} aria-label={`${entry.name}: £${entry.value}`} cursor="pointer" />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          const percent = ((d.value / totalSpent) * 100).toFixed(1);
                          return (
                            <div className="bg-white/90 text-blue-900 rounded shadow px-3 py-2 text-base font-semibold" role="tooltip" aria-label={`${d.name}: £${d.value} (${percent}%)`}>
                              <strong>{d.name}</strong><br />
                              £{d.value} ({percent}%)
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Drilldown Modal */}
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                  {selectedCategory && (console.log('Modal category:', selectedCategory),
                    <DialogContent style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <DialogHeader>
                        <DialogTitle>
                          <div className="flex items-center gap-3">
                            {/* Color badge/icon for category */}
                            <span
                              className="inline-block w-7 h-7 rounded-full shadow"
                              style={{ background: selectedCategory.color, border: '2px solid #fff' }}
                              aria-label={selectedCategory.name}
                            />
                            Transactions for {selectedCategory?.name}
                          </div>
                        </DialogTitle>
                        <DialogDescription>
                          Transaction details for this category.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-2">
                        <div className="font-semibold mb-2">Total: £{selectedCategory?.value?.toLocaleString()}</div>
                        {/* Transaction list */}
                        <ul className="text-sm text-gray-700 space-y-2">
                          {(mockTransactions[selectedCategory?.name] || []).map((tx, i) => (
                            <li key={i} className="flex items-center justify-between border-b border-gray-100 pb-1">
                              <span className="font-medium">{tx.merchant}</span>
                              <span className="text-blue-900 font-semibold">£{tx.amount.toFixed(2)}</span>
                              <span className="text-xs text-gray-400 ml-2">{new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                            </li>
                          ))}
                          {(!mockTransactions[selectedCategory?.name] || mockTransactions[selectedCategory?.name].length === 0) && (
                            <li className="italic text-gray-400">No transactions found.</li>
                          )}
                        </ul>
                        {/* Subtotal/average/percent */}
                        {mockTransactions[selectedCategory.name] && mockTransactions[selectedCategory.name].length > 0 && (
                          <div className="mt-4 flex items-center gap-4 text-sm text-gray-700">
                            <span role="img" aria-label="Average">💡</span>
                            Avg spend: £{(
                              mockTransactions[selectedCategory.name].reduce((sum, t) => sum + t.amount, 0) /
                              mockTransactions[selectedCategory.name].length
                            ).toFixed(2)}
                            | {mockTransactions[selectedCategory.name].length} transactions
                            <span className="ml-2 text-blue-700 font-semibold">
                              {((selectedCategory.value / totalSpent) * 100).toFixed(1)}% of total spend
                            </span>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </div>
              <div className="mt-8 flex flex-col items-center justify-center w-full">
                <div className="text-4xl font-extrabold text-blue-900 text-center">£{totalSpent.toLocaleString()}</div>
                <div className="text-xl text-blue-800 text-center font-medium">Total Spent This Month</div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Top Category Change */}
        <button
          aria-label="View top category change details"
          className="group focus:outline-none h-full"
          onClick={() => handleCardClick('/analytics/categories')}
          tabIndex={0}
          style={{ textAlign: 'left' }}
          title="See which category changed the most this month. This card highlights the category with the largest spending change."
        >
          <Card className="transition-all duration-200 min-h-[320px] h-full flex flex-col justify-between backdrop-blur-xl bg-white/80 border border-pink-100 shadow-lg rounded-2xl group-hover:shadow-2xl group-hover:scale-[1.03] focus:ring-2 focus:ring-pink-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-pink-700">
                <span className="text-xl" aria-label="Takeout">{topChange.icon}</span> Top Category Change
                <span className="ml-2" title="This card highlights the category with the largest spending change."><Info className="w-4 h-4 text-pink-400 inline" aria-label="Info" /></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center flex-1">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 text-white text-2xl font-bold shadow">
                  {topChange.icon}
                </div>
                <div>
                  <div className="text-lg font-bold text-pink-700 flex items-center gap-1">
                    {topChange.up ? <ArrowUpRight className="inline w-5 h-5 text-green-500" aria-label="Up" /> : <ArrowDownLeft className="inline w-5 h-5 text-red-500" aria-label="Down" />}
                    You spent {topChange.percent}% {topChange.up ? 'more' : 'less'} on {topChange.category} this month
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Compared to last month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
        {/* Upcoming Commitments */}
        <button
          aria-label="View upcoming commitments"
          className="group focus:outline-none h-full"
          onClick={() => handleCardClick('/analytics/commitments')}
          tabIndex={0}
          style={{ textAlign: 'left' }}
          title="See your upcoming bills and commitments. This card lists your next scheduled payments."
        >
          <Card className="transition-all duration-200 min-h-[320px] h-full flex flex-col justify-between backdrop-blur-xl bg-white/90 border border-emerald-100 shadow-lg rounded-2xl group-hover:shadow-2xl group-hover:scale-[1.03] focus:ring-2 focus:ring-emerald-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-emerald-700">
                <Calendar className="w-5 h-5 text-emerald-400" aria-label="Calendar" /> Upcoming Commitments
                <span className="ml-2" title="This card lists your next scheduled payments."><Info className="w-4 h-4 text-emerald-400 inline" aria-label="Info" /></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center flex-1">
              <ul className="space-y-2">
                {commitments.map((c, i) => (
                  <li key={i} className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/80">
                    <span className="font-semibold text-emerald-800">{c.label}</span>
                    <span className="text-emerald-900">£{c.amount}</span>
                    <span className="ml-auto text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4 inline" aria-label="Due date" /> {c.due}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </button>
        {/* Financial Health Score */}
        <button
          aria-label="View financial health details"
          className="group focus:outline-none h-full"
          onClick={() => handleCardClick('/analytics/health')}
          tabIndex={0}
          style={{ textAlign: 'left' }}
          title="See your full financial health analysis. This score is based on your savings, spending, and regularity of contributions."
        >
          <Card className="transition-all duration-200 min-h-[320px] h-full flex flex-col justify-between backdrop-blur-xl bg-white/80 border border-purple-100 shadow-lg rounded-2xl group-hover:shadow-2xl group-hover:scale-[1.03] focus:ring-2 focus:ring-purple-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-purple-700">
                <HeartPulse className="w-5 h-5 text-purple-400" aria-label="Health" /> Financial Health Score
                <span className="ml-2" title="This score is based on your savings, spending, and regularity of contributions."><Info className="w-4 h-4 text-purple-400 inline" aria-label="Info" /></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center flex-1">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 120 120" aria-label="Financial Health Score Meter">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#ede9fe" strokeWidth="12" />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="12"
                    strokeDasharray={314}
                    strokeDashoffset={314 - (314 * healthScore) / 100}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,2,.6,1)' }}
                  />
                  <text x="50%" y="54%" textAnchor="middle" fontSize="2.2rem" fontWeight="bold" fill="#7c3aed">{healthScore}</text>
                </svg>
              </div>
              <div className="mt-2 text-lg font-bold text-purple-700">Your Financial Health: {healthScore}/100</div>
              <div className="text-xs text-gray-700 mt-1">Saving regularly boosts your score!</div>
            </CardContent>
          </Card>
        </button>
        {/* Actionable Insight */}
        <button
          aria-label="View actionable insight details"
          className="group focus:outline-none col-span-1 md:col-span-2 xl:col-span-1"
          onClick={() => handleCardClick('/analytics/insights')}
          tabIndex={0}
          style={{ textAlign: 'left' }}
          title={insight}
        >
          <Card className="transition-all duration-200 min-h-[320px] flex flex-col justify-between backdrop-blur-xl bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 shadow-lg rounded-2xl group-hover:shadow-2xl group-hover:scale-[1.03] focus:ring-2 focus:ring-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-blue-700">
                <Info className="w-5 h-5 text-blue-400" aria-label="Info" /> Actionable Insight
                <span className="ml-2" title="A personalized tip to help you save or manage money smarter."><Info className="w-4 h-4 text-blue-400 inline" aria-label="Info" /></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center flex-1">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm font-semibold shadow">
                  💡
                </div>
                <div className="text-base text-blue-900 font-medium">{insight}</div>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>
      <ForwardInsights />
      <div className="flex justify-center mt-8">
        <button
          className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="View More Insights"
          onClick={() => handleCardClick('/analytics')}
          title="See the full analytics dashboard"
        >
          View More Insights
        </button>
      </div>
    </section>
  );
} 