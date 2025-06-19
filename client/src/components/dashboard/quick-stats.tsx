import { TrendingUp, PiggyBank, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface QuickStatsProps {
  stats: {
    creditScore: number;
    savingsRate: number;
    debtFreeDays: number;
  };
}

export default function QuickStats({ stats }: QuickStatsProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                <TrendingUp className="text-white w-4 h-4" />
              </div>
              <span className="text-sm text-gray-700">Credit Score</span>
            </div>
            <span className="font-semibold text-success">{stats.creditScore}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center mr-3">
                <PiggyBank className="text-white w-4 h-4" />
              </div>
              <span className="text-sm text-gray-700">Savings Rate</span>
            </div>
            <span className="font-semibold text-primary">{stats.savingsRate}%</span>
          </div>

          {stats.debtFreeDays > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mr-3">
                  <Calendar className="text-white w-4 h-4" />
                </div>
                <span className="text-sm text-gray-700">Days to Debt Free</span>
              </div>
              <span className="font-semibold text-orange-600">{stats.debtFreeDays}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
