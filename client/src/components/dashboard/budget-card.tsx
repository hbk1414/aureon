import React, { useState, useMemo } from "react";
import BudgetSummaryCard from "@/components/dashboard/budget-summary-card";
import { dummyTransactions, dummyStats, dummyAccounts } from "@/lib/dummyData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Sector } from "recharts";
import { ArrowUpRight, ArrowDownLeft, AlertCircle, TrendingUp, PiggyBank } from "lucide-react";

const COLORS = ["#6366f1", "#06b6d4", "#f59e42", "#f43f5e", "#10b981", "#a78bfa", "#fbbf24", "#f472b6", "#818cf8", "#f87171"];
const TIME_RANGES = [
  { label: "This Month", value: "this" },
  { label: "Last Month", value: "last" },
  { label: "Last 3 Months", value: "3m" },
];

const CATEGORY_ICONS: Record<string, string> = {
  Groceries: "🛒",
  Transport: "🚗",
  dining: "🍽️",
  shopping: "🛍️",
  bills: "💡",
  subscriptions: "📺",
  income: "💰",
  salary: "💰",
  other: "📦",
};

type CategoryTotal = { value: number; count: number; txs: Array<{ date: string; amount: number; category?: string }> };

function getFilteredTransactions(
  transactions: Array<{ date: string; amount: number; accountId?: string | number; category?: string }>,
  timeRange: string,
  account: string,
  category: string
) {
  const now = new Date();
  let filtered = transactions;
  if (account && account !== "all") filtered = filtered.filter(tx => tx.accountId === account);
  if (category && category !== "all") filtered = filtered.filter(tx => (tx.category || "Other") === category);
  if (timeRange === "this") {
    filtered = filtered.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  } else if (timeRange === "last") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    filtered = filtered.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    });
  } else if (timeRange === "3m") {
    const threeAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    filtered = filtered.filter(tx => {
      const d = new Date(tx.date);
      return d >= threeAgo && d <= now;
    });
  }
  return filtered;
}

function getSpendingByCategory(transactions: Array<{ date: string; amount: number; category?: string }>) {
  const categoryTotals: Record<string, CategoryTotal> = {};
  transactions.forEach((tx) => {
    if (tx.amount < 0) {
      const cat = (tx.category || "Other").toLowerCase();
      if (!categoryTotals[cat]) categoryTotals[cat] = { value: 0, count: 0, txs: [] };
      categoryTotals[cat].value += Math.abs(tx.amount);
      categoryTotals[cat].count += 1;
      categoryTotals[cat].txs.push(tx);
    }
  });
  const total = Object.values(categoryTotals).reduce((a: number, b: CategoryTotal) => a + b.value, 0);
  return Object.entries(categoryTotals).map(([name, { value, count, txs }], i) => {
    // Calculate trend vs. last month
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthTotal = txs.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const trend = lastMonthTotal ? Math.round(((value - lastMonthTotal) / lastMonthTotal) * 100) : 0;
    return {
      name,
      value,
      count,
      avg: count ? Math.round(value / count) : 0,
      color: COLORS[i % COLORS.length],
      percent: total ? Math.round((value / total) * 100) : 0,
      trend,
      icon: CATEGORY_ICONS[name] || CATEGORY_ICONS.other,
    };
  });
}

function getMonthOnMonthCategoryData(transactions: Array<{ date: string; amount: number; category?: string }>) {
  const now = new Date();
  const months: { label: string; year: number; month: number }[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('default', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  const cats = Array.from(new Set(transactions.map(tx => (tx.category || "Other").toLowerCase())));
  return cats.map((cat, idx) => {
    const color = COLORS[idx % COLORS.length];
    return {
      category: cat,
      color,
      icon: CATEGORY_ICONS[cat] || CATEGORY_ICONS.other,
      data: months.map(m => {
        const total = transactions.filter(tx => {
          const d = new Date(tx.date);
          return (tx.category || "Other").toLowerCase() === cat && d.getMonth() === m.month && d.getFullYear() === m.year && tx.amount < 0;
        }).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        return { ...m, value: total };
      })
    };
  });
}

// Custom color palette for premium fintech look
const FINTECH_COLORS = ["#7F5AF0", "#2CB67D", "#FF8906", "#F25F4C", "#00A6FB", "#A7A9BE", "#9E77ED"];

const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, name, value, icon, index }: any) => {
  // Modern pointer/line and label outside
  const RADIAN = Math.PI / 180;
  const labelRadius = outerRadius + 36;
  const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);
  const isRight = x > cx;
  const alignOffset = isRight ? 18 : -18;
  return (
    <g>
      {/* Modern leader line with circle pointer */}
      <polyline
        points={`${cx + (outerRadius + 8) * Math.cos(-midAngle * RADIAN)},${cy + (outerRadius + 8) * Math.sin(-midAngle * RADIAN)} ${x},${y}`}
        stroke="#7F5AF0"
        strokeWidth={2.5}
        fill="none"
        style={{ opacity: 0.7 }}
      />
      <circle
        cx={x}
        cy={y}
        r={5}
        fill="#fff"
        stroke="#7F5AF0"
        strokeWidth={2.5}
        style={{ opacity: 0.9 }}
      />
      {/* Label */}
      <text
        x={x + alignOffset}
        y={y}
        fill="#22223B"
        textAnchor={isRight ? "start" : "end"}
        dominantBaseline="central"
        fontSize={22}
        fontWeight={800}
        fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
        style={{ whiteSpace: 'pre', letterSpacing: 1.2, textTransform: 'uppercase', filter: 'drop-shadow(0 1px 2px #fff)' }}
      >
        {icon} {name.toUpperCase()}: £{value.toLocaleString()}
      </text>
    </g>
  );
};

// Custom active shape for pop/scale animation using Sector
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill,
  } = props;
  return (
    <g>
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#7F5AF0" floodOpacity="0.18" />
        </filter>
      </defs>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 14}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        filter="url(#shadow)"
        style={{ transition: 'all 0.25s cubic-bezier(.4,2,.6,1)' }}
      />
    </g>
  );
};

function getKeyTakeaways(data: any[]) {
  if (!data.length) return [];
  const biggest = data.reduce((a, b) => (a.trend > b.trend ? a : b));
  const lowest = data.reduce((a, b) => (a.value < b.value ? a : b));
  const overspent = data.find(d => d.trend > 20);
  return [
    {
      icon: <TrendingUp className="w-5 h-5 text-rose-500" />, label: "Biggest Spike", value: `${biggest.icon} ${biggest.name}`, rec: `Spending up ${biggest.trend}% vs last month` , color: "bg-rose-100 text-rose-700"
    },
    {
      icon: <PiggyBank className="w-5 h-5 text-emerald-600" />, label: "Lowest Category", value: `${lowest.icon} ${lowest.name}`, rec: `Only £${lowest.value} spent`, color: "bg-emerald-100 text-emerald-700"
    },
    overspent ? {
      icon: <AlertCircle className="w-5 h-5 text-orange-500" />, label: "Overspent", value: `${overspent.icon} ${overspent.name}`, rec: `Overspent by £${overspent.value} in ${overspent.name}`, color: "bg-orange-100 text-orange-700"
    } : null
  ].filter(Boolean);
}

function getNaturalLanguageInsights(data: any[], monthOnMonth: any[]) {
  const insights: string[] = [];
  if (data.length > 0 && data[0].trend > 20) insights.push(`You’ve increased spending on ${data[0].name} by ${data[0].trend}% since last month.`);
  if (data.length > 1 && data[1].trend < -20) insights.push(`You’ve cut back on ${data[1].name} by ${Math.abs(data[1].trend)}%. Nice work!`);
  if (monthOnMonth.length > 0 && monthOnMonth[0].data[2]?.value > monthOnMonth[0].data[1]?.value * 2) insights.push(`You’ve doubled spending on ${monthOnMonth[0].category} since ${monthOnMonth[0].data[1]?.label}.`);
  if (insights.length === 0) insights.push("Your spending is steady. Keep it up!");
  return insights.slice(0, 3);
}

export default function BudgetCard() {
  const [timeRange, setTimeRange] = useState('this');
  const [account, setAccount] = useState('all');
  const [category, setCategory] = useState('all');
  const [spendTab, setSpendTab] = useState<'monthly' | 'weekly'>('monthly');
  // Change activeIndex state to undefined instead of null
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Filtered data
  const filteredTxs = useMemo(() => getFilteredTransactions(dummyTransactions, timeRange, account, category), [timeRange, account, category]);
  const spendingData = useMemo(() => getSpendingByCategory(filteredTxs), [filteredTxs]);
  const totalSpent = spendingData.reduce((sum, d) => sum + d.value, 0);
  const monthOnMonth = useMemo(() => getMonthOnMonthCategoryData(filteredTxs), [filteredTxs]);
  const keyTakeaways = getKeyTakeaways(spendingData);
  const nlInsights = getNaturalLanguageInsights(spendingData, monthOnMonth);

  // Unique accounts and categories for filters
  const accountOptions = [{ label: "All Accounts", value: "all" }, ...dummyAccounts.map(a => ({ label: a.name, value: a.id }))];
  const categoryOptions = [{ label: "All Categories", value: "all" }, ...Array.from(new Set(dummyTransactions.map(tx => tx.category || "Other"))).map(c => ({ label: c, value: c }))];

  // For Quick Stats, use top 2 categories and total spent
  const quickStats = [
    ...(spendingData.slice(0, 2).map(cat => ({
      label: `Top: ${cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}`,
      value: `£${cat.value.toLocaleString()}`,
      icon: cat.icon,
      color: 'bg-purple-100 text-purple-700',
    }))),
    {
      label: 'Total Spent',
      value: `£${totalSpent.toLocaleString()}`,
      icon: '💸',
      color: 'bg-rose-100 text-rose-700',
    },
    {
      label: 'Categories',
      value: spendingData.length,
      icon: '📊',
      color: 'bg-blue-100 text-blue-700',
    },
  ];

  // AI actionable suggestions (example logic)
  const aiSuggestions = [
    spendingData[0]?.trend > 20 ? `You overspent on ${spendingData[0].name}. Try setting a weekly limit or using cash envelopes for this category.` : null,
    spendingData[1]?.trend < -20 ? `Great job reducing your ${spendingData[1].name} spend! Consider reallocating savings to your emergency fund.` : null,
    totalSpent > dummyStats.monthlyIncome * 0.8 ? `You're close to your monthly budget. Review subscriptions and cut non-essentials to stay on track.` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 p-6 flex flex-col items-start">
      <BudgetSummaryCard transactions={filteredTxs} monthlyBudget={dummyStats.monthlyIncome} />
      {/* Filter Strip + Spend Tab Switcher */}
      <div className="w-full mb-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          {TIME_RANGES.map(opt => (
            <button
              key={opt.value}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${timeRange === opt.value ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
              onClick={() => setTimeRange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <button
              className={`px-3 py-1 text-xs font-semibold transition ${spendTab === 'monthly' ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}
              onClick={() => setSpendTab('monthly')}
            >Monthly</button>
            <button
              className={`px-3 py-1 text-xs font-semibold transition ${spendTab === 'weekly' ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}
              onClick={() => setSpendTab('weekly')}
            >Weekly</button>
          </div>
          <select className="rounded-md border px-2 py-1 text-xs" value={account} onChange={e => setAccount(e.target.value)}>
            {accountOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select className="rounded-md border px-2 py-1 text-xs" value={category} onChange={e => setCategory(e.target.value)}>
            {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
      {/* Centered Pie Chart */}
      <div className="w-full mb-10">
        <div className="bg-white rounded-2xl shadow p-6 w-full min-w-0">
          {/* Pie Chart only, no toggle */}
          {spendingData.length > 0 ? (
            <div className="w-full h-[500px] px-12">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={170}
                    isAnimationActive={true}
                    animationDuration={900}
                    label={renderCustomLabel}
                    labelLine={true}
                    minAngle={18}
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, idx) => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                  >
                    {spendingData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={FINTECH_COLORS[idx % FINTECH_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white rounded-lg shadow px-4 py-3 text-base text-gray-900 border border-gray-100">
                            <div className="font-bold text-lg mb-1">{d.icon} {d.name}</div>
                            <div className="mb-1">Amount: <span className="font-semibold">£{d.value.toLocaleString()}</span></div>
                            <div>Percent: <span className="font-semibold">{d.percent}%</span></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Central label for total spent and subtitle */}
                  <g>
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={24}
                      fontWeight={700}
                      fill="#18181b"
                      className="select-none"
                    >
                      £{totalSpent.toLocaleString()} spent
                    </text>
                    <text
                      x="50%"
                      y="56%"
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      fontSize={14}
                      fontWeight={500}
                      fill="#7F5AF0"
                      className="select-none"
                    >
                      Total Monthly Spend
                    </text>
                  </g>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-gray-400 text-sm py-8 text-center w-full">No transactions recorded yet. Start spending to see insights.</div>
          )}
        </div>
      </div>
      {/* Full-width Bar Chart below */}
      <div className="w-full mt-10">
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center min-w-0">
          <h4 className="text-md font-semibold mb-2 text-gray-700">How Your Spending Changed <span className="text-xs text-gray-400">({spendTab === 'monthly' ? 'Month-on-Month' : 'Week-on-Week'})</span></h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthOnMonth[0]?.data.map((_, i) => {
              const obj: any = { month: monthOnMonth[0]?.data[i]?.label };
              monthOnMonth.forEach(cat => {
                obj[cat.category] = cat.data[i].value;
              });
              return obj;
            })} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 13 }} />
              <YAxis tickFormatter={v => `£${v}`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white rounded-lg shadow px-3 py-2 text-xs text-gray-800 border border-gray-100">
                        {payload.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span>{monthOnMonth.find(c => c.category === p.dataKey)?.icon}</span>
                            <span className="font-semibold">{p.dataKey}</span>
                            <span>£{p.value?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {monthOnMonth.map(cat => (
                <Bar key={cat.category} dataKey={cat.category} fill={cat.color} radius={[6, 6, 6, 6]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          {/* Category labels under bars */}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {monthOnMonth.map(cat => (
              <span key={cat.category} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${cat.color} bg-opacity-20`}>
                <span>{cat.icon}</span>
                {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 