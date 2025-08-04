import { useState, useMemo } from "react";
import BudgetSummaryCard from "@/components/dashboard/budget-summary-card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { ArrowUpRight, ArrowDownLeft, AlertCircle, TrendingUp, PiggyBank } from "lucide-react";
import { useTrueLayerData } from "@/hooks/use-truelayer-data";

const COLORS = ["#6366f1", "#06b6d4", "#f59e42", "#f43f5e", "#10b981", "#a78bfa", "#fbbf24", "#f472b6", "#818cf8", "#f87171"];


const CATEGORY_ICONS: Record<string, string> = {
  Groceries: "🛒",
  Transport: "🚗",
  Dining: "🍽️",
  Shopping: "🛍️",
  Bills: "💡",
  Subscriptions: "📺",
  Other: "📦",
};

function BudgetCardTrueLayer() {
  const { data: trueLayerData, loading, error } = useTrueLayerData();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const chartData = useMemo(() => {
    if (!trueLayerData) return [];
    
    return trueLayerData.spendingCategories.map((category, index) => ({
      name: category.name,
      value: category.amount,
      percentage: category.percentage,
      icon: CATEGORY_ICONS[category.name] || "📦",
      color: COLORS[index % COLORS.length]
    }));
  }, [trueLayerData]);

  const accounts = useMemo(() => {
    if (!trueLayerData) return [];
    return trueLayerData.accounts.map(account => ({
      id: account.account_id,
      name: account.display_name,
      balance: trueLayerData.balances[account.account_id]?.current || 0
    }));
  }, [trueLayerData]);

  const categories = useMemo(() => {
    if (!trueLayerData) return [];
    return trueLayerData.spendingCategories.map(cat => cat.name);
  }, [trueLayerData]);

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-semibold text-lg">
          {payload.icon}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="font-medium">
          {`${payload.name}`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-sm">
          {`£${value.toFixed(2)} (${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-3xl shadow-xl p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded mt-6"></div>
        </div>
      </div>
    );
  }

  if (error || !trueLayerData) {
    return (
      <div className="w-full bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Banking Data</h3>
          <p className="text-gray-600">Connect your bank account to see detailed spending insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <PiggyBank className="h-6 w-6 mr-3 text-indigo-600" />
              Financial Overview
            </h2>
            <p className="text-gray-600 mt-1">Real-time data from your connected bank accounts</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <BudgetSummaryCard
            title="Total Balance"
            value={`£${trueLayerData.totalBalance.toLocaleString()}`}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={null}
            color="blue"
          />
          <BudgetSummaryCard
            title="Total Income"
            value={`£${trueLayerData.totalIncome.toLocaleString()}`}
            icon={<ArrowDownLeft className="h-5 w-5" />}
            trend={null}
            color="green"
          />
          <BudgetSummaryCard
            title="Total Spent"
            value={`£${trueLayerData.totalSpent.toLocaleString()}`}
            icon={<ArrowUpRight className="h-5 w-5" />}
            trend={null}
            color="red"
          />
          <BudgetSummaryCard
            title="Net Income"
            value={`£${(trueLayerData.totalIncome - trueLayerData.totalSpent).toLocaleString()}`}
            icon={<PiggyBank className="h-5 w-5" />}
            trend={null}
            color={trueLayerData.totalIncome - trueLayerData.totalSpent >= 0 ? "green" : "red"}
          />
        </div>

        {/* Accounts Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Accounts</h3>
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{account.name}</div>
                    <div className="text-sm text-gray-500">Account ID: {account.id.slice(0, 8)}...</div>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    £{account.balance.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spending by Category Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(undefined)}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border">
                              <p className="font-medium">{data.icon} {data.name}</p>
                              <p className="text-sm text-gray-600">
                                £{data.value.toFixed(2)} ({data.percentage.toFixed(1)}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No spending data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {trueLayerData.spendingCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {CATEGORY_ICONS[category.name]} {category.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {category.transactions} transaction{category.transactions !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    £{category.amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetCardTrueLayer;