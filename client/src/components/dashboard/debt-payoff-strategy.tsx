import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DebtAccount } from "@shared/schema";

interface DebtPayoffStrategyProps {
  debtAccounts: DebtAccount[];
}

export default function DebtPayoffStrategy({ debtAccounts }: DebtPayoffStrategyProps) {
  const handleApplyStrategy = () => {
    // TODO: Implement debt strategy application
    console.log('Apply debt strategy');
  };

  const getPriorityBadge = (priority: number | null) => {
    if (!priority) return null;
    
    const priorityMap = {
      1: { label: "Priority #1", className: "bg-red-100 text-red-700" },
      2: { label: "Priority #2", className: "bg-yellow-100 text-yellow-700" },
      3: { label: "Priority #3", className: "bg-blue-100 text-blue-700" },
    };
    
    const config = priorityMap[priority as keyof typeof priorityMap];
    if (!config) return null;
    
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (debtAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Debt Payoff Strategy</h3>
          <p className="text-gray-600">No debt accounts found. Great job staying debt-free!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">AI Debt Payoff Strategy</h3>
          <Badge variant="secondary" className="bg-accent text-white">
            AI Optimized
          </Badge>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <Lightbulb className="text-orange-500 mr-2 w-5 h-5" />
            <span className="font-medium text-gray-800">Recommendation</span>
          </div>
          <p className="text-gray-700 text-sm mb-3">
            Focus on your highest interest debt first using the avalanche method. 
            You'll save money on interest and become debt-free sooner.
          </p>
          <Button 
            onClick={handleApplyStrategy}
            className="bg-orange-500 text-white hover:bg-orange-600"
            size="sm"
          >
            Apply Strategy
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debtAccounts.map((debt) => (
            <div key={debt.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-800">{debt.name}</span>
                {getPriorityBadge(debt.priority)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Balance</span>
                  <span className="font-medium">£{parseFloat(debt.balance).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">APR</span>
                  <span className="font-medium text-danger">{parseFloat(debt.apr).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {debt.suggestedPayment ? 'Suggested Payment' : 'Minimum Payment'}
                  </span>
                  <span className={`font-medium ${debt.suggestedPayment ? 'text-primary' : ''}`}>
                    £{parseFloat(debt.suggestedPayment || debt.minimumPayment).toLocaleString()}/month
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
