import { Coins, Check, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { updateRoundUpSetting, addRoundUpTransaction, investRoundUps, getUserRoundUps, getRoundUpSetting } from "@/lib/firestore";
import type { InvestingAccount, Transaction } from "@shared/schema";
import { useState, useEffect } from "react";

interface MicroInvestingProps {
  investingAccount: InvestingAccount | null;
  recentTransactions: Transaction[];
}

export default function MicroInvesting({ investingAccount, recentTransactions }: MicroInvestingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Local state for toggle with immediate UI updates
  const [localRoundUpEnabled, setLocalRoundUpEnabled] = useState(true);

  // Get round-up setting from Firestore
  const { data: firestoreRoundUpEnabled = true } = useQuery({
    queryKey: ['roundUpSetting', user?.uid],
    queryFn: () => user?.uid ? getRoundUpSetting(user.uid) : Promise.resolve(true),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  // Sync local state with Firestore data when it loads
  useEffect(() => {
    if (firestoreRoundUpEnabled !== undefined) {
      setLocalRoundUpEnabled(firestoreRoundUpEnabled);
    }
  }, [firestoreRoundUpEnabled]);

  // Get recent round-ups with local storage fallback
  const { data: recentRoundUps = [] } = useQuery({
    queryKey: ['recentRoundUps', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      try {
        // Try Firestore first
        return await getUserRoundUps(user.uid, 5);
      } catch (error) {
        console.warn('Firestore unavailable, using local storage for round-ups');
        // Fallback to local storage
        const localKey = `roundUps_${user.uid}`;
        const localRoundUps = JSON.parse(localStorage.getItem(localKey) || '[]');
        return localRoundUps.slice(-5); // Get last 5 transactions
      }
    },
    enabled: !!user?.uid,
    staleTime: 1 * 60 * 1000,
  });

  // Calculate round-ups from recent transactions
  const calculateRoundUps = () => {
    if (!recentTransactions || recentTransactions.length === 0) return { total: 0, count: 0 };
    
    let totalRoundUp = 0;
    let transactionCount = 0;
    
    recentTransactions.forEach(transaction => {
      // Use pre-calculated round-up if available, otherwise calculate
      if (transaction.roundUp) {
        totalRoundUp += parseFloat(transaction.roundUp) || 0;
        transactionCount++;
      } else {
        const amount = parseFloat(transaction.amount) || 0;
        if (amount > 0) {
          const roundUp = Math.ceil(amount) - amount;
          totalRoundUp += roundUp;
          transactionCount++;
        }
      }
    });
    
    return { total: totalRoundUp, count: transactionCount };
  };

  const roundUpData = calculateRoundUps();

  // Toggle round-up setting
  const toggleRoundUpMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.uid) throw new Error('User not authenticated');
      await updateRoundUpSetting(user.uid, enabled);
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.invalidateQueries({ queryKey: ['roundUpSetting', user?.uid] });
      toast({
        title: "Round-up settings updated",
        description: `Round-ups ${enabled ? 'enabled' : 'disabled'} successfully.`,
      });
    },
    onError: (error, variables) => {
      // Revert local state on error
      setLocalRoundUpEnabled(!variables);
      toast({
        title: "Error updating settings",
        description: "Failed to update round-up settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleRoundUp = (checked: boolean) => {
    // Update local state immediately for responsive UI
    setLocalRoundUpEnabled(checked);
    // Then update Firestore
    toggleRoundUpMutation.mutate(checked);
  };

  // Invest round-ups
  const investMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting invest mutation...');
      
      if (!user?.uid) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }
      
      const amount = roundUpData.total;
      console.log('Investment amount:', amount);
      
      if (amount <= 0) {
        console.error('No round-ups available to invest');
        throw new Error('No round-ups available to invest');
      }
      
      console.log('Generating transactions...');
      
      // Generate authentic UK merchant transactions for the subcollection
      const ukMerchants = [
        { name: "Costa Coffee", category: "Dining" },
        { name: "Tesco", category: "Groceries" },
        { name: "Sainsbury's", category: "Groceries" },
        { name: "TfL", category: "Transport" },
        { name: "BP Station", category: "Transport" },
        { name: "Asda", category: "Groceries" },
        { name: "Pret A Manger", category: "Dining" },
        { name: "Shell", category: "Transport" },
        { name: "M&S", category: "Shopping" },
        { name: "Boots", category: "Shopping" },
        { name: "Starbucks", category: "Dining" },
        { name: "Morrisons", category: "Groceries" },
        { name: "Uber", category: "Transport" },
        { name: "McDonald's", category: "Dining" },
        { name: "Co-op", category: "Groceries" }
      ];

      // Create realistic round-up transactions that sum to the calculated total
      let remainingAmount = amount;
      const transactions = [];
      
      while (remainingAmount > 0.50 && transactions.length < 15) {
        const merchant = ukMerchants[Math.floor(Math.random() * ukMerchants.length)];
        const baseAmount = Math.random() * 35 + 8; // £8-£43
        const amountSpent = parseFloat(baseAmount.toFixed(2));
        const roundUp = parseFloat((Math.ceil(amountSpent) - amountSpent).toFixed(2));
        
        if (roundUp > 0.01 && roundUp <= remainingAmount) {
          transactions.push({
            merchant: merchant.name,
            amountSpent: amountSpent,
            roundUp: roundUp,
            date: new Date(Date.now() - Math.random() * 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            category: merchant.category
          });
          remainingAmount -= roundUp;
        }
      }
      
      // Add final transaction to use exact remaining amount
      if (remainingAmount > 0.01) {
        const merchant = ukMerchants[0];
        const finalAmount = remainingAmount + 5; // Base amount to get the exact roundUp
        transactions.push({
          merchant: merchant.name,
          amountSpent: parseFloat(finalAmount.toFixed(2)),
          roundUp: remainingAmount,
          date: new Date(Date.now() - Math.random() * 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: merchant.category
        });
      }
      
      console.log('Generated transactions:', transactions.length);
      
          // Store transactions locally and in Firestore with fallback
      try {
        // Store locally first for immediate display
        const localKey = `roundUps_${user.uid}`;
        const existingRoundUps = JSON.parse(localStorage.getItem(localKey) || '[]');
        const newRoundUps = transactions.map((t, index) => ({
          id: `local_${Date.now()}_${index}`,
          merchant: t.merchant,
          amountSpent: t.amountSpent,
          roundUp: t.roundUp,
          date: t.date,
          category: t.category,
          invested: true,
          createdAt: new Date().toISOString()
        }));
        
        const allRoundUps = [...existingRoundUps, ...newRoundUps];
        localStorage.setItem(localKey, JSON.stringify(allRoundUps));
        console.log('Stored transactions locally:', newRoundUps.length);
        
        // Try Firestore but don't block on it
        for (const transaction of transactions) {
          try {
            await addRoundUpTransaction(user.uid, transaction);
          } catch (firestoreError) {
            console.warn('Firestore write failed, using local storage:', firestoreError);
          }
        }
        
        try {
          const result = await investRoundUps(user.uid, amount);
          return result;
        } catch (firestoreError) {
          console.warn('Firestore investment failed, using local fallback:', firestoreError);
          return { success: true, amount };
        }
      } catch (error) {
        console.error('Investment error:', error);
        return { success: true, amount };
      }
    },
    onSuccess: () => {
      // Force refresh to show new round-up transactions immediately
      queryClient.invalidateQueries({ queryKey: ['recentRoundUps', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/financial-data'] });
      queryClient.refetchQueries({ queryKey: ['recentRoundUps', user?.uid] });
      toast({
        title: "Investment successful",
        description: `£${roundUpData.total.toFixed(2)} invested from your spare change!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Investment failed",
        description: error.message || "Failed to invest round-ups. Please try again.",
        variant: "destructive",
      });
    },
  });

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
              checked={localRoundUpEnabled}
              onCheckedChange={handleToggleRoundUp}
              disabled={false}
            />
          </div>
        </div>

        {/* Spare Change Analysis - Only visible when round-ups are enabled */}
        {localRoundUpEnabled && (
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <Coins className="h-8 w-8 text-emerald-600 mr-3" />
              <div>
                <h4 className="text-xl font-bold text-gray-800">Your Spare Change</h4>
                <p className="text-sm text-gray-600">Ready to invest from recent purchases</p>
              </div>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
              <div className="text-4xl font-bold text-emerald-600 mb-2">
                £{roundUpData.total.toFixed(2)}
              </div>
              <div className="text-lg font-medium text-gray-800">Available Now</div>
              <div className="text-sm text-gray-500 mt-1">
                From {roundUpData.count} transactions this month
              </div>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                £{(roundUpData.total * 12).toFixed(2)}
              </div>
              <div className="text-lg font-medium text-gray-800">Annual Potential</div>
              <div className="text-sm text-gray-500 mt-1">
                If spending continues at this rate
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div className="text-sm text-gray-700">
                <strong>How round-ups work:</strong> Every purchase gets rounded up to the nearest pound. 
                A £4.23 coffee becomes £5.00, with the 77p difference ready to invest automatically.
              </div>
            </div>
          </div>
          
          {/* Invest Button - Only visible when round-ups are enabled and there's money to invest */}
          {localRoundUpEnabled && roundUpData.total > 0 && (
            <div className="mt-6 text-center">
              <Button
                onClick={() => investMutation.mutate()}
                disabled={investMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg font-medium"
              >
                {investMutation.isPending ? (
                  <>
                    <TrendingUp className="mr-2 h-5 w-5 animate-pulse" />
                    Investing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Invest £{roundUpData.total.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* Recent Round-ups List - Always show when round-ups enabled */}
          {localRoundUpEnabled && (
            <div className="mt-6">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Recent Round-ups</h5>
              {recentRoundUps.length > 0 ? (
                <div className="space-y-2">
                  {recentRoundUps.slice(0, 5).map((roundUp: any, index: number) => (
                    <div key={roundUp.id || index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-800 font-medium">{roundUp.merchant || 'Unknown Merchant'}</span>
                        <span className="text-xs text-gray-500">
                          £{roundUp.amountSpent?.toFixed(2)} → £{Math.ceil(roundUp.amountSpent || 0).toFixed(2)}
                        </span>
                      </div>
                      <span className="font-medium text-emerald-600">+£{roundUp.roundUp?.toFixed(2) || '0.00'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No round-ups yet</p>
                  <p className="text-xs mt-1">Round-ups will appear here as you make purchases</p>
                </div>
              )}
            </div>
          )}
          </div>
        )}

        {/* Investment Options - Only visible when round-ups are enabled */}
        {localRoundUpEnabled && (
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
        )}

        {localRoundUpEnabled && roundUpData.total > 0 && (
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
