import { ShoppingCart, Car, Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SpendingCategory {
  name: string;
  amount: number;
  transactions: number;
  percentage: number;
}

interface SpendingOverviewProps {
  spending: {
    total: number;
    budget: number;
    remaining: number;
    categories: SpendingCategory[];
  };
}

const getCategoryIcon = (categoryName: string) => {
  if (categoryName.toLowerCase().includes('grocer') || categoryName.toLowerCase().includes('food')) {
    return <ShoppingCart className="text-primary w-5 h-5" />;
  }
  if (categoryName.toLowerCase().includes('gas') || categoryName.toLowerCase().includes('transport')) {
    return <Car className="text-success w-5 h-5" />;
  }
  if (categoryName.toLowerCase().includes('entertainment')) {
    return <Film className="text-accent w-5 h-5" />;
  }
  return <ShoppingCart className="text-primary w-5 h-5" />;
};

const getCategoryColor = (categoryName: string) => {
  if (categoryName.toLowerCase().includes('grocer') || categoryName.toLowerCase().includes('food')) {
    return 'bg-blue-100';
  }
  if (categoryName.toLowerCase().includes('gas') || categoryName.toLowerCase().includes('transport')) {
    return 'bg-green-100';
  }
  if (categoryName.toLowerCase().includes('entertainment')) {
    return 'bg-purple-100';
  }
  return 'bg-blue-100';
};

const getProgressColor = (categoryName: string) => {
  if (categoryName.toLowerCase().includes('grocer') || categoryName.toLowerCase().includes('food')) {
    return 'bg-primary';
  }
  if (categoryName.toLowerCase().includes('gas') || categoryName.toLowerCase().includes('transport')) {
    return 'bg-success';
  }
  if (categoryName.toLowerCase().includes('entertainment')) {
    return 'bg-accent';
  }
  return 'bg-primary';
};

export default function SpendingOverview({ spending }: SpendingOverviewProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Spending This Month</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              £{(spending.total || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              £{(spending.budget || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Monthly Budget</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              £{(spending.remaining || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
        </div>

        <div className="space-y-4">
          {spending.categories && spending.categories.length > 0 ? 
            spending.categories.slice(0, 3).map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-10 h-10 ${getCategoryColor(category.name)} rounded-lg flex items-center justify-center mr-3`}>
                    {getCategoryIcon(category.name)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{category.name}</div>
                    <div className="text-sm text-gray-600">{category.percentage}% of spending</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-4">
                    <div 
                      className={`${getProgressColor(category.name)} h-2 rounded-full`}
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="font-semibold text-gray-800 w-16 text-right">
                    £{category.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            )) : (
            <div className="text-center py-8 text-gray-500">
              <p>No spending data available yet.</p>
              <p className="text-sm mt-2">Connect your bank accounts to see spending insights.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
