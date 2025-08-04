import { TrendingUp, DollarSign, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CountUp from "react-countup";

interface IncomeCategory {
  name: string;
  amount: number;
  transactions: number;
}

interface IncomeOverviewProps {
  totalIncome: number;
  incomeCategories: IncomeCategory[];
}

export default function IncomeOverview({ totalIncome, incomeCategories }: IncomeOverviewProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          Income This Month
        </h3>
        
        <div className="mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 flex items-center justify-center">
              <DollarSign className="h-6 w-6 mr-1" />
              <CountUp
                end={totalIncome}
                duration={2}
                separator=","
                decimals={2}
                decimal="."
                prefix="£"
              />
            </div>
            <div className="text-sm text-gray-500 mt-1">Total income received</div>
          </div>
        </div>

        {incomeCategories.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Income Sources</h4>
            {incomeCategories.map((category, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <PlusCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{category.name}</div>
                    <div className="text-sm text-gray-500">
                      {category.transactions} transaction{category.transactions !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-green-600">
                  +£{category.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}