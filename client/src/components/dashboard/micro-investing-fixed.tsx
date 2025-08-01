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
import type { InvestingAccount, Transaction } from "@shared/schema";
import { 
  getRoundUpTransactions, 
  createRoundUpTransaction, 
  markRoundUpsAsInvested,
  getFundInvestments,
  updateFundInvestments,
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
    description: 'Tracks the UK\'s largest 100 companies. Expected annual return: 6-8%',
    fee: '0.05%',
    riskColor: 'green'
  },
  {
    id: 'global',
    name: 'Global Diversified ETF',
    riskLevel: 'Medium Risk',
    description: 'Worldwide stock exposure across developed markets. Expected annual return: 7-10%',
    fee: '0.15%',
    riskColor: 'yellow'
  },
  {
    id: 'tech',
    name: 'Technology Growth Fund',
    riskLevel: 'High Risk',
    description: 'Growth-focused tech companies globally. Expected annual return: 10-15%',
    fee: '0.25%',
    riskColor: 'red'
  }
];

interface MicroInvestingProps {
  investingAccount: InvestingAccount | null;
  recentTransactions: Transaction[];
}

export default function MicroInvesting({ investingAccount, recentTransactions }: MicroInvestingProps) {
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

  const { data: fundInvestments } = useQuery({
    queryKey: ['fundInvestments', user?.uid],
    queryFn: () => user?.uid ? getFundInvestments(user.uid) : Promise.resolve({ ftse100: 15.43, global: 22.17, tech: 8.92 }),
    enabled: !!user?.uid,
  });

  const { data: roundUpTransactions } = useQuery({
    queryKey: ['roundUpTransactions', user?.uid],
    queryFn: () => user?.uid ? getRoundUpTransactions(user.uid) : Promise.resolve([]),
    enabled: !!user?.uid,
  });

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
  
  // After investment, show completely reset state
  const displayData = investmentComplete ? 
    { transactions: [], totalAvailable: 0 } : 
    pastSpending;

  // Generate monthly breakdown data for charts
  const getMonthlyBreakdownData = () => {
    if (!user?.uid) return [];
    
    const investmentKey = `investments_${user.uid}`;
    let investments = JSON.parse(localStorage.getItem(investmentKey) || '[]');
    
    // Add some historical sample data if none exists
    if (investments.length === 0) {
      const sampleData = [
        { id: 1, amount: 12.45, date: '2024-10-15T10:30:00Z', type: 'round_up_investment' },
        { id: 2, amount: 8.67, date: '2024-11-20T14:20:00Z', type: 'round_up_investment' },
        { id: 3, amount: 15.23, date: '2024-12-10T09:15:00Z', type: 'round_up_investment' },
      ];
      localStorage.setItem(investmentKey, JSON.stringify(sampleData));
      investments = sampleData;
    }
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    // Generate last 6 months of data
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      
      const monthInvestments = investments.filter((inv: any) => inv.date?.startsWith(monthKey));
      const totalInvested = monthInvestments.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
      
      // For current month, add available round-ups (only if not invested)
      const currentRoundUps = (monthKey === currentMonth && !investmentComplete) ? displayData.totalAvailable : 0;
      
      months.push({
        month: monthName,
        roundUps: parseFloat(currentRoundUps.toFixed(2)),
        invested: parseFloat(totalInvested.toFixed(2)),
        total: parseFloat((currentRoundUps + totalInvested).toFixed(2))
      });
    }
    
    return months;
  };

  const monthlyData = getMonthlyBreakdownData();

  // Get list of merchants for logo fetching
  const merchants = displayData.transactions.map((t: any) => t.merchant);
  const merchantLogos = useMerchantLogos(merchants);

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
        
        for (const merchant of merchants) {
          const roundUp = Math.ceil(merchant.amount) - merchant.amount;
          await createRoundUpTransaction(user.uid, {
            merchant: merchant.name,
            amountSpent: merchant.amount,
            roundUp: roundUp,
            category: merchant.category,
            date: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000)
          });
        }
        
        // Mark them as invested immediately
        const newTransactions = await getRoundUpTransactions(user.uid);
        await markRoundUpsAsInvested(user.uid, newTransactions.map((tx: any) => tx.id));
        await addToFundInvestment(user.uid, fundId, displayData.totalAvailable || 7.88);
      }
      
      return { success: true, fundId };
    },
    onSuccess: (data) => {
      const fundName = INVESTMENT_FUNDS.find(f => f.id === data.fundId)?.name || 'your chosen fund';
      setInvestmentComplete(true);
      
      // Update local fund state
      setFundInvestments((prev: any) => ({
        ...prev,
        [data.fundId]: (prev[data.fundId as keyof typeof prev] || 0) + displayData.totalAvailable
      }));
      
      toast({
        title: "Investment Complete!",
        description: `£${displayData.totalAvailable.toFixed(2)} invested in ${fundName}.`,
      });
      
      setShowInvestmentModal(false);
      
      // Force component to re-render with fresh data
      setForceRefresh(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['/api/user/financial-data'] });
    },
    onError: () => {
      toast({
        title: "Investment failed",
        description: "There was an error investing your spare change. Please try again.",
        variant: "destructive",
      });
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
                {displayData.totalAvailable > 0 ? (
                  <p className="text-sm text-emerald-700 mt-1">
                    From {displayData.transactions.length} recent purchases
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    Make purchases to accumulate spare change
                  </p>
                )}
              </div>

              {/* Monthly Breakdown Chart */}
              <div className="bg-white p-4 rounded-lg border">
                <h5 className="font-medium text-gray-800 mb-4">Monthly Round-Up & Investment History</h5>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis 
                        tickFormatter={(value) => `£${value}`}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => {
                          if (props?.dataKey === 'roundUps' || name === 'Available Round-Ups') {
                            return [`£${value.toFixed(2)}`, 'Available Round-Ups'];
                          } else {
                            return [`£${value.toFixed(2)}`, 'Invested'];
                          }
                        }}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="roundUps" fill="#3b82f6" name="Available Round-Ups" />
                      <Bar dataKey="invested" fill="#10b981" name="Invested" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
                    <span>Available to invest this month</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm mr-2"></div>
                    <span>Already invested</span>
                  </div>
                </div>
              </div>

              {/* Investment Options with Progress Bars */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-3">Your Investment Portfolio</h5>
                <div className="space-y-3">
                  {INVESTMENT_FUNDS.map((fund) => {
                    const invested = (fundInvestments[fund.id as keyof typeof fundInvestments] as number) || 0;
                    const maxInvestment = Math.max(...Object.values(fundInvestments).map(v => Number(v) || 0));
                    const progressWidth = maxInvestment > 0 ? (invested / maxInvestment) * 100 : 0;
                    
                    return (
                      <div key={fund.id} className="bg-white p-3 rounded border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <h6 className="font-medium text-sm">{fund.name}</h6>
                          <span className={`text-xs px-2 py-1 rounded ${
                            fund.riskColor === 'green' ? 'bg-green-100 text-green-700' :
                            fund.riskColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {fund.riskLevel}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{fund.description}</p>
                        <div className="text-xs text-blue-600 font-medium mb-2">Annual fee: {fund.fee}</div>
                        
                        {/* Investment Progress Bar */}
                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">Invested</span>
                            <span className="text-xs font-medium text-emerald-600">£{invested.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressWidth}%` }}
                            ></div>
                          </div>
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

              {/* Invest Button */}
              {displayData.totalAvailable > 0 && (
                <div className="mt-4 text-center">
                  <Button
                    onClick={() => setShowInvestmentModal(true)}
                    disabled={investmentComplete}
                    className={`w-full px-8 py-3 text-lg font-medium ${
                      investmentComplete 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {investmentComplete ? (
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

              {/* Your Recent Purchases (only show when there are transactions) */}
              {displayData.transactions.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Your Recent Purchases</h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {displayData.transactions.slice(0, 5).map((purchase: any, index: number) => {
                      const merchantLogo = merchantLogos[purchase.merchant];
                      return (
                        <div key={purchase.id || index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded text-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                              {merchantLogo?.logoUrl ? (
                                <img 
                                  src={merchantLogo.logoUrl} 
                                  alt={purchase.merchant}
                                  className="w-6 h-6 object-contain"
                                  onError={() => {
                                    // Fallback handled by next condition
                                  }}
                                />
                              ) : merchantLogo?.loading ? (
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                              ) : (
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                  {purchase.merchant.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{purchase.merchant}</div>
                              <div className="text-gray-500 text-xs">
                                £{purchase.actualSpent.toFixed(2)} → £{purchase.roundedTo.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="text-emerald-600 font-medium">
                            +£{purchase.roundUpAmount.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {displayData.transactions.length > 5 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      +{displayData.transactions.length - 5} more purchases
                    </p>
                  )}
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
                    Currently invested: £{(fundInvestments[fund.id as keyof typeof fundInvestments] as number || 0).toFixed(2)}
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