import { Coins, Check, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMerchantLogos } from "@/hooks/use-merchant-logos";
import { 
  getRoundUpTransactions, 
  createRoundUpTransaction, 
  markRoundUpsAsInvested,
  getFundInvestments,
  addToFundInvestment,
  getRoundUpSettings,
  updateRoundUpSettings
} from "@/lib/firestore";

// Investment fund options
const INVESTMENT_FUNDS = [
  {
    id: 'ftse100',
    name: 'FTSE 100 Index Fund',
    riskLevel: 'Low Risk',
    riskColor: 'green',
    description: 'Track the UK\'s largest 100 companies with steady returns.',
    fee: '0.15%',
  },
  {
    id: 'global',
    name: 'Global Diversified ETF',
    riskLevel: 'Medium Risk',
    riskColor: 'yellow',
    description: 'Worldwide exposure across developed and emerging markets.',
    fee: '0.25%',
  },
  {
    id: 'tech',
    name: 'Technology Growth Fund',
    riskLevel: 'High Risk',
    riskColor: 'red',
    description: 'Focus on innovative tech companies with high growth potential.',
    fee: '0.45%',
  }
];

export function MicroInvesting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [investmentComplete, setInvestmentComplete] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  
  // Firestore queries
  const { data: roundUpSettings } = useQuery({
    queryKey: ['roundUpSettings', user?.uid],
    queryFn: () => user?.uid ? getRoundUpSettings(user.uid) : Promise.resolve({ enabled: true }),
    enabled: !!user?.uid,
  });

  const { data: fundInvestments = { ftse100: 15.43, global: 22.17, tech: 8.92 } } = useQuery({
    queryKey: ['fundInvestments', user?.uid],
    queryFn: () => user?.uid ? getFundInvestments(user.uid) : Promise.resolve({ ftse100: 15.43, global: 22.17, tech: 8.92 }),
    enabled: !!user?.uid,
  });

  const { data: roundUpTransactions = [] } = useQuery({
    queryKey: ['roundUpTransactions', user?.uid],
    queryFn: () => user?.uid ? getRoundUpTransactions(user.uid) : Promise.resolve([]),
    enabled: !!user?.uid,
  });

  // Calculate display data based on Firestore transactions
  const calculateDisplayData = () => {
    const transactions = roundUpTransactions || [];

    // If no transactions exist, create some sample data
    if (transactions.length === 0 && user?.uid) {
      return {
        totalAvailable: 7.88,
        recentTransactions: [
          { merchant: "Costa Coffee", roundUp: 0.77, category: "Dining" },
          { merchant: "Tesco Express", roundUp: 1.53, category: "Groceries" },
          { merchant: "TfL Oyster", roundUp: 0.80, category: "Transport" },
          { merchant: "Marks & Spencer", roundUp: 2.33, category: "Shopping" },
          { merchant: "Shell", roundUp: 2.45, category: "Transport" }
        ],
        transactions: []
      };
    }

    const totalAvailable = transactions
      .filter((tx: any) => !tx.invested)
      .reduce((sum: number, tx: any) => sum + (tx.roundUp || 0), 0);

    return {
      totalAvailable: Math.round(totalAvailable * 100) / 100,
      recentTransactions: transactions.slice(0, 5),
      transactions
    };
  };

  const displayData = calculateDisplayData();

  // Get list of merchants for logo fetching
  const merchants = displayData.recentTransactions.map((t: any) => t.merchant);
  const merchantLogosData = useMerchantLogos(merchants);

  // Round-up toggle mutation
  const toggleRoundUpMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.uid) throw new Error('User not authenticated');
      await updateRoundUpSettings(user.uid, { enabled });
      return enabled;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roundUpSettings', user?.uid] });
    },
  });

  // Investment mutation using Firestore
  const investMutation = useMutation({
    mutationFn: async (fundId: string) => {
      if (!user?.uid) throw new Error('User not authenticated');
      
      console.log('Investing spare change in fund:', fundId, displayData.totalAvailable);
      
      try {
        // Get uninvested round-ups
        const uninvestedTransactions = roundUpTransactions?.filter((tx: any) => !tx.invested) || [];
        
        if (uninvestedTransactions.length > 0) {
          // Mark round-ups as invested
          await markRoundUpsAsInvested(user.uid, uninvestedTransactions.map((tx: any) => tx.id));
          
          // Update fund investment totals
          await addToFundInvestment(user.uid, fundId, displayData.totalAvailable);
        } else {
          // Generate some new round-up transactions if none exist
          const merchants = [
            { name: "Costa Coffee", amount: 4.23, category: "Dining" },
            { name: "Tesco Express", amount: 8.47, category: "Groceries" },
            { name: "Shell", amount: 45.83, category: "Transport" },
            { name: "Marks & Spencer", amount: 12.67, category: "Shopping" },
            { name: "TfL Oyster", amount: 15.20, category: "Transport" },
          ];
          
          const transactionIds = [];
          for (const merchant of merchants) {
            const roundUp = Math.ceil(merchant.amount) - merchant.amount;
            const id = await createRoundUpTransaction(user.uid, {
              merchant: merchant.name,
              amountSpent: merchant.amount,
              roundUp: roundUp,
              category: merchant.category,
              date: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000)
            });
            transactionIds.push(id);
          }
          
          // Mark them as invested immediately
          await markRoundUpsAsInvested(user.uid, transactionIds);
          await addToFundInvestment(user.uid, fundId, displayData.totalAvailable || 7.88);
        }
        
        return { success: true, fundId };
      } catch (error) {
        console.error('Investment error:', error);
        throw new Error(`Investment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    onSuccess: (data) => {
      const fundName = INVESTMENT_FUNDS.find(f => f.id === data.fundId)?.name || 'your chosen fund';
      setInvestmentComplete(true);
      setShowInvestmentModal(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['fundInvestments', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['roundUpTransactions', user?.uid] });
      
      toast({
        title: "Investment Complete!",
        description: `Successfully invested £${displayData.totalAvailable.toFixed(2)} in ${fundName}`,
      });
    },
    onError: (error) => {
      console.error('Investment mutation error:', error);
      toast({
        title: "Investment failed",
        description: error instanceof Error ? error.message : "There was an error investing your spare change. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Monthly breakdown data for chart
  const getMonthlyBreakdownData = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-GB', { month: 'short' });
      
      months.push({
        month: monthName,
        available: Math.random() * 15 + 5,
        invested: Math.random() * 25 + 10
      });
    }
    
    return months;
  };

  const monthlyData = getMonthlyBreakdownData();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-emerald-600" />
            <h4 className="text-lg font-semibold">Spare Change Investing</h4>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="round-up-toggle"
              checked={roundUpSettings?.enabled ?? true}
              onCheckedChange={(checked) => toggleRoundUpMutation.mutate(checked)}
            />
            <Label htmlFor="round-up-toggle" className="text-sm font-medium">
              Round up purchases
            </Label>
          </div>
        </div>

        {(roundUpSettings?.enabled ?? true) ? (
          <>
            <div className="space-y-6">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <h5 className="font-medium text-emerald-800 mb-2">Available to Invest</h5>
                <div className="text-2xl font-bold text-emerald-600">
                  £{displayData.totalAvailable.toFixed(2)}
                </div>
                <p className="text-sm text-emerald-700 mt-1">
                  From recent round-ups
                </p>
              </div>

              {displayData.totalAvailable > 0 && (
                <Button 
                  onClick={() => setShowInvestmentModal(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={investMutation.isPending}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  {investMutation.isPending ? 'Processing...' : 'Invest Spare Change'}
                </Button>
              )}

              {/* Investment Options with Progress Bars */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-3">Your Investment Portfolio</h5>
                <div className="space-y-3">
                  {INVESTMENT_FUNDS.map((fund) => {
                    const invested = (fundInvestments[fund.id as keyof typeof fundInvestments] as number) || 0;
                    const maxInvestment = Math.max(...Object.values(fundInvestments).map(v => Number(v) || 0));
                    const progressWidth = maxInvestment > 0 ? (invested / maxInvestment) * 100 : 0;
                    
                    return (
                      <div key={fund.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-blue-700">{fund.name}</span>
                          <span className="text-sm font-bold text-blue-800">£{invested.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 p-3 bg-blue-100 rounded text-xs text-blue-800">
                  <div className="flex justify-between items-center">
                    <span><strong>Total Portfolio Value:</strong> £{Object.values(fundInvestments).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0).toFixed(2)}</span>
                    {displayData.totalAvailable > 0 && (
                      <span><strong>Available to Invest:</strong> £{displayData.totalAvailable.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Round-ups */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-700">Recent Round-ups</h5>
                <div className="space-y-2">
                  {displayData.recentTransactions.map((transaction: any, index: number) => {
                    const logo = merchantLogosData[transaction.merchant];
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" 
                               style={{ 
                                 background: logo?.logoUrl ? `url(${logo.logoUrl}) center/cover` : 
                                 `linear-gradient(135deg, 
                                   ${transaction.category === 'Transport' ? '#3B82F6, #1E40AF' :
                                     transaction.category === 'Groceries' ? '#10B981, #047857' :
                                     transaction.category === 'Dining' ? '#F59E0B, #D97706' :
                                     '#8B5CF6, #7C3AED'})` 
                               }}>
                            {!logo?.logoUrl && transaction.merchant.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{transaction.merchant}</div>
                            <div className="text-xs text-gray-500">{transaction.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-emerald-600">+£{transaction.roundUp?.toFixed(2) || '0.00'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Breakdown Chart */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-700">6-Month Round-Up & Investment History</h5>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `£${value}`} />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `£${Number(value).toFixed(2)}`, 
                          name
                        ]}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Legend />
                      <Bar dataKey="available" fill="#3B82F6" name="Rounded up this month" />
                      <Bar dataKey="invested" fill="#10B981" name="Invested this month" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
                    <span>Round-ups collected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm mr-2"></div>
                    <span>Amount invested</span>
                  </div>
                </div>
              </div>
            </div>

            {investmentComplete && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">Investment successful!</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Coins className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Round-up investing is disabled</p>
            <p className="text-sm">Enable round-up purchases to start investing your spare change</p>
          </div>
        )}
      </CardContent>
      
      {/* Investment Selection Modal */}
      <Dialog open={showInvestmentModal} onOpenChange={setShowInvestmentModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Investment Fund</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Select which fund to invest your £{displayData.totalAvailable.toFixed(2)} spare change into:
            </p>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {INVESTMENT_FUNDS.map((fund) => (
                <div
                  key={fund.id}
                  className="border rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => investMutation.mutate(fund.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h6 className="font-medium text-sm pr-2">{fund.name}</h6>
                    <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                      fund.riskColor === 'green' ? 'bg-green-100 text-green-700' :
                      fund.riskColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {fund.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">{fund.description}</p>
                  <div className="text-xs text-blue-600 font-medium mb-1">Annual fee: {fund.fee}</div>
                  <div className="text-xs text-emerald-600 font-medium">
                    Currently invested: £{((fundInvestments as any)[fund.id] || 0).toFixed(2)}
                  </div>
                  
                  {investMutation.isPending ? (
                    <div className="mt-2 text-center">
                      <div className="inline-flex items-center text-xs text-blue-600">
                        <TrendingUp className="mr-1 h-3 w-3 animate-pulse" />
                        Processing...
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-center">
                      <span className="text-xs text-blue-600 font-medium">Click to invest</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}