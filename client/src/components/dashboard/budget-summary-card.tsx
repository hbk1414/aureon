import React from "react";
import { Info } from "lucide-react";

function getMonthStats(transactions: any[], monthlyBudget: number) {
  // Only consider current month
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let income = 0, spent = 0;
  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    if (txDate.getMonth() === month && txDate.getFullYear() === year) {
      const amt = Number(tx.amount);
      if (amt > 0 && ["income", "salary"].includes((tx.category || "").toLowerCase())) {
        income += amt;
      } else if (amt < 0) {
        spent += Math.abs(amt);
      }
    }
  });
  const saved = Math.max(0, income - spent);
  // Available to spend = income - spent - saved
  const available = income - spent - saved;
  return {
    income,
    spent,
    saved,
    available,
  };
}

const STAT_CONFIG = [
  {
    key: "income",
    label: "Total Income",
    icon: "💰",
    color: "bg-emerald-100 text-emerald-600",
    tooltip: "Sum of all income/salary transactions this month."
  },
  {
    key: "spent",
    label: "Total Spent",
    icon: "🧾",
    color: "bg-rose-100 text-rose-600",
    tooltip: "Sum of all spending (negative) transactions this month."
  },
  {
    key: "saved",
    label: "Total Saved",
    icon: "🏦",
    color: "bg-sky-100 text-sky-600",
    tooltip: "Income minus spending for this month."
  },
  {
    key: "available",
    label: "Available to Spend",
    icon: "📈",
    color: "bg-purple-100 text-purple-600",
    tooltip: "Total income minus total spent and total saved for this month."
  },
];

export default function BudgetSummaryCard({ transactions, monthlyBudget }: { transactions: any[]; monthlyBudget: number }) {
  const { income, spent, saved, available } = getMonthStats(transactions, monthlyBudget);
  const statValues: Record<string, number> = { income, spent, saved, available };

  return (
    <div className="w-full mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CONFIG.map((stat) => {
          const isAvailable = stat.key === "available";
          const isNegative = isAvailable && statValues[stat.key] < 0;
          return (
            <div
              key={stat.key}
              className="group bg-white rounded-xl shadow-md border border-gray-100 p-5 flex flex-col items-start md:items-center transition hover:shadow-lg min-h-[120px] cursor-pointer"
              tabIndex={0}
              role="button"
            >
              <div className="flex items-center mb-2 w-full">
                <span className={`text-2xl mr-2 rounded-lg p-2 ${stat.color}`}>{stat.icon}</span>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide mr-1">{stat.label}</span>
                <span title={stat.tooltip} className="ml-1">
                  <Info className="w-4 h-4 text-gray-400" />
                </span>
              </div>
              <span className={`text-2xl md:text-3xl font-bold w-full ${isAvailable ? (isNegative ? 'text-rose-600' : stat.color.split(" ")[1]) : stat.color.split(" ")[1]}`}>
                {isAvailable && isNegative ? '-' : ''}£{Math.abs(statValues[stat.key]).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              {isAvailable && isNegative && (
                <span className="mt-2 text-xs text-rose-600 font-semibold w-full text-left md:text-center">
                  Overspent by £{Math.abs(statValues[stat.key]).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2 w-full text-center">
        Based on this month’s income, spending, and savings.
      </div>
    </div>
  );
} 