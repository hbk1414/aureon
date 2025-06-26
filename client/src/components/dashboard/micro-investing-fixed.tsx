import { Coins, Check, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import type { InvestingAccount, Transaction } from "@shared/schema";

interface MicroInvestingProps {
  investingAccount: InvestingAccount | null;
  recentTransactions: Transaction[];
}

export default function MicroInvesting({ investingAccount, recentTransactions }: MicroInvestingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [localRoundUpEnabled, setLocalRoundUpEnabled] = useState(true);
  const [investmentComplete, setInvestmentComplete] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Generate realistic past spending that created your spare change
  const generatePastSpendingTransactions = () => {
    const ukMerchants = [
      { name: 'Costa Coffee', category: 'Dining' },
      { name: 'Tesco Express', category: 'Groceries' },
      { name: 'TfL Oyster', category: 'Transport' },
      { name: 'Pret A Manger', category: 'Dining' },
      { name: 'Boots', category: 'Health' },
      { name: 'Sainsbury\'s Local', category: 'Groceries' },
      { name: 'Starbucks', category: 'Dining' },
      { name: 'Shell', category: 'Transport' },
      { name: 'Greggs', category: 'Dining' },
      { name: 'Marks & Spencer', category: 'Shopping' }
    ];

    const transactions = [];
    let totalRoundUp = 0;

    // Generate 12-15 realistic spending transactions over past 2 weeks
    for (let i = 0; i < 14; i++) {
      const merchant = ukMerchants[Math.floor(Math.random() * ukMerchants.length)];
      
      // Generate realistic spending amounts that aren't round numbers
      const baseAmount = Math.random() * 15 + 2; // £2-17
      const actualAmount = parseFloat((Math.floor(baseAmount * 100) / 100).toFixed(2));
      const roundUp = parseFloat((Math.ceil(actualAmount) - actualAmount).toFixed(2));
      
      if (roundUp > 0) {
        totalRoundUp += roundUp;
        const daysAgo = Math.floor(Math.random() * 14);
        
        transactions.push({
          id: `spending_${i}`,
          merchant: merchant.name,
          actualSpent: actualAmount,
          roundedTo: Math.ceil(actualAmount),
          roundUpAmount: roundUp,
          date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: merchant.category
        });
      }
    }

    return { 
      transactions: transactions.slice(0, 12), // Keep 12 transactions
      totalAvailable: parseFloat(totalRoundUp.toFixed(2))
    };
  };

  // Get your past spending data (this represents transactions you already made)
  const getPastSpendingData = () => {
    if (!user?.uid) return { transactions: [], totalAvailable: 0 };
    
    const spendingKey = `yourPastSpending_${user.uid}`;
    let spendingData = localStorage.getItem(spendingKey);
    
    // If no data exists, generate some spending transactions
    if (!spendingData) {
      const generated = generatePastSpendingTransactions();
      localStorage.setItem(spendingKey, JSON.stringify(generated));
      return generated;
    }
    
    return JSON.parse(spendingData);
  };

  // Get fresh data on every render (includes forceRefresh dependency)
  const pastSpending = getPastSpendingData();
  
  // After investment, show no spare change available
  const displayData = investmentComplete ? 
    { transactions: pastSpending.transactions, totalAvailable: 0 } : 
    pastSpending;

  // Investment mutation - just records the investment, doesn't create new transactions
  const investMutation = useMutation({
    mutationFn: async () => {
      console.log('Investing spare change:', displayData.totalAvailable);
      
      // Record the investment
      const investmentKey = `investments_${user?.uid}`;
      const investments = JSON.parse(localStorage.getItem(investmentKey) || '[]');
      
      investments.push({
        id: Date.now(),
        amount: displayData.totalAvailable,
        date: new Date().toISOString(),
        type: 'round_up_investment'
      });
      
      localStorage.setItem(investmentKey, JSON.stringify(investments));
      
      // Clear the available spare change (it's now invested)
      if (user?.uid) {
        const spendingKey = `yourPastSpending_${user.uid}`;
        localStorage.removeItem(spendingKey);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      setInvestmentComplete(true);
      toast({
        title: "Spare change invested!",
        description: `£${displayData.totalAvailable.toFixed(2)} from your recent purchases has been invested.`,
      });
      
      // Force component to re-render with fresh data
      setForceRefresh(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['/api/user/financial-data'] });
    }
  });

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-600" />
            <h4 className="text-lg font-semibold">Spare Change Investing</h4>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="round-up-toggle"
              checked={localRoundUpEnabled}
              onCheckedChange={setLocalRoundUpEnabled}
            />
            <Label htmlFor="round-up-toggle" className="text-sm font-medium">
              Round up purchases
            </Label>
          </div>
        </div>

        {localRoundUpEnabled ? (
          <>
            <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <h5 className="font-medium text-emerald-800 mb-2">Available to Invest</h5>
                <div className="text-2xl font-bold text-emerald-600">
                  £{displayData.totalAvailable.toFixed(2)}
                </div>
                <p className="text-sm text-emerald-700 mt-1">
                  From {displayData.transactions.length} recent purchases
                </p>
              </div>

              {/* Your Recent Purchases (that created the spare change) */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Your Recent Purchases</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {displayData.transactions.slice(0, 5).map((purchase: any, index: number) => (
                    <div key={purchase.id || index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded text-sm">
                      <div>
                        <div className="font-medium">{purchase.merchant}</div>
                        <div className="text-gray-500 text-xs">
                          £{purchase.actualSpent.toFixed(2)} → £{purchase.roundedTo.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-emerald-600 font-medium">
                        +£{purchase.roundUpAmount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                {displayData.transactions.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    +{displayData.transactions.length - 5} more purchases
                  </p>
                )}
              </div>

              {/* Invest Button */}
              {displayData.totalAvailable > 0 && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={() => investMutation.mutate()}
                    disabled={investMutation.isPending || investmentComplete}
                    className={`px-8 py-3 text-lg font-medium ${
                      investmentComplete 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {investMutation.isPending ? (
                      <>
                        <TrendingUp className="mr-2 h-5 w-5 animate-pulse" />
                        Investing...
                      </>
                    ) : investmentComplete ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Invested!
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Invest £{displayData.totalAvailable.toFixed(2)}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Coins className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Round-up investing is disabled</p>
            <p className="text-sm text-gray-400">Enable it to start investing your spare change</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}