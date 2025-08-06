import { useState, useMemo } from "react";
import BudgetSummaryCard from "@/components/dashboard/budget-summary-card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { ArrowUpRight, ArrowDownLeft, AlertCircle, TrendingUp, PiggyBank, ChevronDown, ChevronRight } from "lucide-react";
import { useTrueLayerData } from "@/hooks/use-truelayer-data";
import SpendingPieChart from "@/components/charts/spending-pie-chart";

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

// Categorization function (matches the one in use-truelayer-data.ts)
const categorizeTransaction = (transaction: any): string => {
  const description = transaction.description?.toLowerCase() || '';
  const merchantName = transaction.merchant_name?.toLowerCase() || '';

  if (description.includes('tesco') || description.includes('sainsbury') || description.includes('asda') || merchantName.includes('tesco') || merchantName.includes('sainsbury')) {
    return 'Groceries';
  }
  if (description.includes('shell') || description.includes('petrol') || description.includes('fuel') || merchantName.includes('shell')) {
    return 'Transport';
  }
  if (description.includes('netflix') || description.includes('spotify') || description.includes('disney') || merchantName.includes('netflix') || merchantName.includes('spotify')) {
    return 'Subscriptions';
  }
  if (description.includes('coffee') || description.includes('starbucks') || description.includes('costa') || merchantName.includes('starbucks') || merchantName.includes('costa')) {
    return 'Dining';
  }
  if (description.includes('amazon') || merchantName.includes('amazon')) {
    return 'Shopping';
  }
  if (description.includes('rent') || description.includes('council') || description.includes('gas') || description.includes('electric') || description.includes('internet')) {
    return 'Bills';
  }
  if (description.includes('bus') || description.includes('tfl') || merchantName.includes('tfl')) {
    return 'Transport';
  }
  
  return 'Other';
};

function BudgetCardTrueLayer() {
  const { data: trueLayerData, loading, error } = useTrueLayerData();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-blue-900">Total Balance</h3>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              £{trueLayerData.totalBalance.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-xl border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowDownLeft className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-green-900">Total Income</h3>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900">
              £{trueLayerData.totalIncome.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-red-50 p-6 rounded-xl border border-red-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArrowUpRight className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-sm font-medium text-red-900">Total Spent</h3>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-900">
              £{trueLayerData.totalSpent.toLocaleString()}
            </div>
          </div>
          
          <div className={`${trueLayerData.totalIncome - trueLayerData.totalSpent >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} p-6 rounded-xl border`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${trueLayerData.totalIncome - trueLayerData.totalSpent >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg`}>
                  <PiggyBank className={`h-5 w-5 ${trueLayerData.totalIncome - trueLayerData.totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <h3 className={`text-sm font-medium ${trueLayerData.totalIncome - trueLayerData.totalSpent >= 0 ? 'text-green-900' : 'text-red-900'}`}>Net Income</h3>
              </div>
            </div>
            <div className={`text-2xl font-bold ${trueLayerData.totalIncome - trueLayerData.totalSpent >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              £{(trueLayerData.totalIncome - trueLayerData.totalSpent).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Interactive Spending Chart */}
        {/* <div className="mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-inner border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Interactive Spending Chart</h3>
            <SpendingPieChart 
              data={trueLayerData.spendingCategories.map(cat => {
                // Get transactions for this category
                const allTransactions = Object.values(trueLayerData.transactions || {}).flat();
                const categoryTransactions = allTransactions.filter(
                  tx => tx.transaction_type === 'DEBIT' && categorizeTransaction(tx) === cat.name
                ).map(tx => ({
                  id: tx.transaction_id,
                  description: tx.description,
                  amount: Math.abs(tx.amount),
                  date: tx.timestamp,
                  merchant: tx.merchant_name || tx.description
                }));

                return {
                  name: cat.name,
                  value: cat.amount,
                  color: cat.color || '#6366f1',
                  transactions: categoryTransactions
                };
              })}
            />
          </div>
        </div> */}

        {/* Category Breakdown with Expandable Transaction Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {trueLayerData.spendingCategories.map((category, index) => {
              const isExpanded = expandedCategories.has(category.name);
              // Get all transactions from all accounts for this category
              const allTransactions = Object.values(trueLayerData.transactions || {}).flat();
              const categoryTransactions = allTransactions.filter(
                tx => tx.transaction_type === 'DEBIT' && categorizeTransaction(tx) === category.name
              );

              return (
                <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      const newExpanded = new Set(expandedCategories);
                      if (isExpanded) {
                        newExpanded.delete(category.name);
                      } else {
                        newExpanded.add(category.name);
                      }
                      setExpandedCategories(newExpanded);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                      </div>
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
                  
                  {/* Expanded Transaction Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-white">
                      <div className="p-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Transactions:</h4>
                        {categoryTransactions.slice(0, 5).map((transaction, txIndex) => (
                          <div key={txIndex} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              <div className="text-xs text-gray-500">
                                {new Date(transaction.timestamp).toLocaleDateString()}
                              </div>
                              <div className="font-medium text-sm text-gray-900">
                                {transaction.description || transaction.merchant_name || 'Unknown Merchant'}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-red-600">
                              -£{Math.abs(transaction.amount).toFixed(2)}
                            </div>
                          </div>
                        ))}
                        {categoryTransactions.length > 5 && (
                          <div className="text-xs text-gray-500 text-center pt-2">
                            And {categoryTransactions.length - 5} more transactions...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetCardTrueLayer;