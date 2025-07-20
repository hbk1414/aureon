import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { motion } from "framer-motion";

const ACTIONS = [
  {
    emoji: "💸",
    label: "Transfer Funds",
    description: "Move money between accounts",
    color: "bg-blue-100 text-blue-600",
    tooltip: "Send or move money between your connected accounts.",
  },
  {
    emoji: "🎯",
    label: "Create Savings Goal",
    description: "Set up a new savings target",
    color: "bg-emerald-100 text-emerald-600",
    tooltip: "Start a new goal to save for something important.",
  },
  {
    emoji: "📊",
    label: "Analyse Spending",
    description: "View detailed spending insights",
    color: "bg-purple-100 text-purple-600",
    tooltip: "See where your money goes each month.",
  },
  {
    emoji: "🧾",
    label: "Pay Bills",
    description: "Schedule or make payments",
    color: "bg-orange-100 text-orange-600",
    tooltip: "Pay your regular bills and subscriptions.",
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {ACTIONS.map((action, idx) => (
        <motion.div
          key={action.label}
          className="group bg-white rounded-xl shadow-md border border-gray-100 p-5 flex flex-col items-start md:items-center transition hover:shadow-lg cursor-pointer min-h-[140px]"
          whileHover={{ y: -2, scale: 1.03 }}
          tabIndex={0}
          role="button"
        >
          <div className="flex items-center mb-2 w-full">
            <span className={`text-2xl mr-2 rounded-lg p-2 ${action.color}`}>{action.emoji}</span>
            <span className="text-base font-semibold text-gray-800 mr-1">{action.label}</span>
            <span title={action.tooltip} className="ml-1">
              <Info className="w-4 h-4 text-gray-400" />
            </span>
          </div>
          <span className="text-sm text-gray-500 mb-1 w-full text-left md:text-center">{action.description}</span>
        </motion.div>
      ))}
    </div>
  );
}