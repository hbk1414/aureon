import { Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InvestingAccount, Transaction } from "@shared/schema";

interface MicroInvestingProps {
  investingAccount: InvestingAccount | null;
  recentTransactions: Transaction[];
}

export default function MicroInvesting({ investingAccount, recentTransactions }: MicroInvestingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate round-ups from recent transactions
  const calculateRoundUps = () => {
    if (!recentTransactions || recentTransactions.length === 0) return { total: 0, count: 0 };
    
    let totalRoundUp = 0;
    let transactionCount = 0;
    
    recentTransactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount) || 0;
      if (amount > 0) {
        const roundUp = Math.ceil(amount) - amount;
        totalRoundUp += roundUp;
        transactionCount++;
      }
    });
    
    return { total: totalRoundUp, count: transactionCount };
  };

  const roundUpData = calculateRoundUps();

  const toggleRoundUpMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest("PATCH", "/api/investing/1/toggle-roundup", { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/1"] });
      toast({
        title: "Success",
        description: "Round-up investing settings updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update round-up settings",
        variant: "destructive",
      });
    },
  });

  const handleToggleRoundUp = (checked: boolean) => {
    toggleRoundUpMutation.mutate(checked);
  };

  const investmentOptions = [
    {
      name: "FTSE 100 Index Fund",
      type: "Low Risk",
      description: "Track the UK's top 100 companies",
      expectedReturn: "6-8% annually",
      color: "bg-green-100 text-green-800"
    },
    {
      name: "Global Diversified ETF",
      type: "Medium Risk", 
      description: "Worldwide stock market exposure",
      expectedReturn: "7-10% annually",
      color: "bg-blue-100 text-blue-800"
    },
    {
      name: "Technology Growth Fund",
      type: "High Risk",
      description: "Focus on innovative tech companies",
      expectedReturn: "10-15% annually",
      color: "bg-purple-100 text-purple-800"
    }
  ];

  // Always show micro investing with round-up calculations
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Micro-Investing</h3>
          <div className="flex items-center space-x-2">
            <Label htmlFor="roundup-toggle" className="text-sm text-gray-600">
              Round-up
            </Label>
            <Switch
              id="roundup-toggle"
              checked={investingAccount?.roundUpEnabled || false}
              onCheckedChange={handleToggleRoundUp}
              disabled={toggleRoundUpMutation.isPending}
            />
          </div>
        </div>

        {/* Round-up Analysis */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Coins className="h-6 w-6 text-indigo-600 mr-2" />
            <h4 className="text-lg font-semibold text-gray-800">Spare Change Analysis</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="text-center bg-white rounded-lg p-4">
              <div className="text-3xl font-bold text-indigo-600">
                £{roundUpData.total.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Available to Invest</div>
              <div className="text-xs text-gray-500 mt-1">
                From {roundUpData.count} transactions
              </div>
            </div>
            <div className="text-center bg-white rounded-lg p-4">
              <div className="text-3xl font-bold text-emerald-600">
                £{(roundUpData.total * 12).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Potential Annual Investing</div>
              <div className="text-xs text-gray-500 mt-1">
                If this trend continues
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 bg-white rounded-lg p-3">
            <strong>How it works:</strong> Each purchase gets rounded up to the nearest pound. 
            For example, a £4.23 coffee becomes £5.00, investing the 77p difference.
          </div>
        </div>

        {/* Investment Options */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Investment Options</h4>
          {investmentOptions.map((option, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-semibold text-gray-800">{option.name}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                      {option.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{option.description}</p>
                  <p className="text-sm font-medium text-gray-800">Expected: {option.expectedReturn}</p>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Invest
                </button>
              </div>
            </div>
          ))}
        </div>

        {roundUpData.total > 0 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center">
              <Coins className="h-5 w-5 text-amber-600 mr-2" />
              <div className="text-sm">
                <span className="font-medium text-amber-800">Ready to invest:</span>
                <span className="text-amber-700 ml-1">
                  You have £{roundUpData.total.toFixed(2)} in spare change ready to put to work!
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
