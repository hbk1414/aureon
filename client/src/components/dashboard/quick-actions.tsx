import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Target, TrendingUp, CreditCard } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      icon: ArrowUpDown,
      label: "Transfer Funds",
      description: "Move money between accounts",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      icon: Target,
      label: "Create Savings Goal",
      description: "Set up a new savings target",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      icon: TrendingUp,
      label: "Analyse Spending",
      description: "View detailed spending insights",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      icon: CreditCard,
      label: "Pay Bills",
      description: "Schedule or make payments",
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <div className={`p-3 rounded-full text-white ${action.color} transition-colors`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">{action.label}</div>
                <div className="text-xs text-gray-500 mt-1">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}