import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { PlusCircle, Target, TrendingUp, Info, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addEmergencyFundContribution, getEmergencyFundContributions } from "@/lib/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Label as RechartsLabel } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import clsx from "clsx";
import { Switch } from "@/components/ui/switch";

interface EmergencyFundData {
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  targetMonths: number;
  createdAt: Date;
  updatedAt: Date;
}

export function EmergencyFund() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [addAmount, setAddAmount] = useState<string>("");
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupData, setSetupData] = useState({
    targetAmount: 15000,
    monthlyContribution: 500,
    targetMonths: 6,
  });
  const [selectedTimeline, setSelectedTimeline] = useState(6);
  const [isOpen, setIsOpen] = useState(true);

  // Fetch emergency fund data from Firestore
  const { data: emergencyFund, isLoading } = useQuery({
    queryKey: ['emergencyFund', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      
      const docRef = doc(db, 'users', user.uid, 'emergencyFund', 'current');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          currentAmount: data.currentAmount || 0,
          targetAmount: data.targetAmount || 15000,
          monthlyContribution: data.monthlyContribution || 500,
          targetMonths: data.targetMonths || 6,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as EmergencyFundData;
      }
      return null;
    },
    enabled: !!user?.uid,
  });

  // Fetch contributions
  const { data: contributions = [], refetch: refetchContributions } = useQuery({
    queryKey: ["emergencyFundContributions", user?.uid],
    queryFn: () => user?.uid ? getEmergencyFundContributions(user.uid) : Promise.resolve([]),
    enabled: !!user?.uid,
  });

  // Calculate milestones and achievements
  const getMilestones = () => {
    if (!emergencyFund) return [];
    const milestones = [
      { amount: 500, label: "First £500", icon: "🎯" },
      { amount: 1000, label: "£1K Milestone", icon: "💰" },
      { amount: 2500, label: "Quarter Way", icon: "🏆" },
      { amount: 5000, label: "Halfway There", icon: "⭐" },
      { amount: 7500, label: "Three Quarters", icon: "🌟" },
      { amount: emergencyFund.targetAmount, label: "Goal Reached!", icon: "🎉" }
    ];
    return milestones.filter(m => m.amount <= emergencyFund.targetAmount);
  };

  const getAchievedMilestones = () => {
    const milestones = getMilestones();
    return milestones.filter(m => currentAmount >= m.amount);
  };

  const getNextMilestone = () => {
    const milestones = getMilestones();
    return milestones.find(m => currentAmount < m.amount);
  };

  // Calculate days covered instead of months
  const getDaysCovered = () => {
    if (!emergencyFund) return 0;
    const monthlyExpenses = emergencyFund.targetAmount / emergencyFund.targetMonths;
    const daysInMonth = 30.44; // Average days per month
    return Math.round((currentAmount / monthlyExpenses) * daysInMonth);
  };

  // Calculate monthly target and progress
  const getMonthlyTarget = () => {
    if (!emergencyFund) return 0;
    return emergencyFund.targetAmount / selectedTimeline;
  };

  const getCurrentMonthProgress = () => {
    if (!emergencyFund || !contributions.length) return 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthContributions = contributions.filter((c: any) => {
      const d = new Date(c.date);
      const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      return monthKey === currentMonth;
    });
    return monthContributions.reduce((sum: number, c: any) => sum + c.amount, 0);
  };

  const getProgressNudge = () => {
    const monthlyTarget = getMonthlyTarget();
    const currentMonthProgress = getCurrentMonthProgress();
    const remaining = monthlyTarget - currentMonthProgress;
    
    if (remaining > 0) {
      return `You need £${remaining.toFixed(0)} more this month to stay on track.`;
    } else if (remaining < 0) {
      return `Great job! You're £${Math.abs(remaining).toFixed(0)} ahead this month.`;
    } else {
      return "Perfect! You're exactly on track this month.";
    }
  };

  // Calculate monthly data for the bar graph
  let monthlyData: { month: string; actual: number; target: number; remaining: number | undefined; monthLabel: string }[] = [];
  let totalInvested = 0;
  let goalHitMonthIndex = null;
  let newRequiredMonthly = 0;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Contributions:', contributions);
      console.log('EmergencyFund:', emergencyFund);
      console.log('MonthlyData:', monthlyData);
    }
  }, [contributions, emergencyFund, selectedTimeline]);

  if (emergencyFund) {
    const startDate = new Date(emergencyFund.createdAt);
    const targetMonths = selectedTimeline;
    const grouped: Record<string, number> = {};
    (contributions || []).forEach((c: any) => {
      const d = new Date(c.date);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      grouped[key] = (grouped[key] || 0) + c.amount;
      totalInvested += c.amount;
    });

    // Find current month index
    const now = new Date();
    let currentMonthIndex = 0;
    for (let i = 0; i < targetMonths; i++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + i);
      if (
        monthDate.getFullYear() === now.getFullYear() &&
        monthDate.getMonth() === now.getMonth()
      ) {
        currentMonthIndex = i;
        break;
      }
      if (monthDate < now) currentMonthIndex = i;
    }

    // Calculate new required monthly amount
    const monthsLeft = targetMonths - currentMonthIndex - 1;
    const remainingToGoal = Math.max(emergencyFund.targetAmount - totalInvested, 0);
    newRequiredMonthly = monthsLeft > 0 ? remainingToGoal / monthsLeft : 0;

    // Build monthly data and find goal hit month
    monthlyData = [];
    let runningTotal = 0;
    let goalHit = false;
    for (let i = 0; i < targetMonths; i++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + i);
      const monthKey = `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1).toString().padStart(2, "0")}`;
      const monthLabel = monthDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      const actual = grouped[monthKey] || 0;
      let target = 0, remaining = undefined;
      // Debug output
      if (process.env.NODE_ENV === 'development') {
        console.log({
          i,
          monthLabel,
          actual,
          newRequiredMonthly,
          isCurrentMonth: i === currentMonthIndex,
          target,
          remaining
        });
      }
      if (i < currentMonthIndex) {
        // Past months: show both required and actual invested
        target = newRequiredMonthly;
        remaining = undefined;
        runningTotal += actual;
      } else if (i === currentMonthIndex) {
        // Current month: if actual >= required, show only actual; else show required and remaining
        if (actual >= newRequiredMonthly) {
          target = 0;
          remaining = undefined;
        } else {
          target = newRequiredMonthly;
          remaining = target - actual > 0 ? target - actual : undefined;
        }
        runningTotal += actual;
      } else {
        // Future months: show required as target, remaining is same (since nothing invested yet)
        target = newRequiredMonthly;
        remaining = target;
        // runningTotal += target; // Don't add to runningTotal for future months
      }
      if (!goalHit && runningTotal >= emergencyFund.targetAmount) {
        goalHitMonthIndex = i;
        goalHit = true;
      }
      monthlyData.push({
        month: monthKey,
        actual,
        target,
        remaining,
        monthLabel
      });
    }
  }

  // Create emergency fund
  const createFundMutation = useMutation({
    mutationFn: async (data: Omit<EmergencyFundData, 'createdAt' | 'updatedAt'>) => {
      if (!user?.uid) throw new Error('User not authenticated');
      
      const docRef = doc(db, 'users', user.uid, 'emergencyFund', 'current');
      await setDoc(docRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyFund', user?.uid] });
      setShowSetupModal(false);
      toast({
        title: "Emergency Fund Created!",
        description: "Your emergency fund has been set up successfully.",
      });
    },
    onError: (error) => {
      console.error('Create emergency fund error:', error);
      toast({
        title: "Error",
        description: "Failed to create emergency fund. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add to emergency fund
  const addToFundMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user?.uid || !emergencyFund) throw new Error('User not authenticated or fund not found');
      const docRef = doc(db, 'users', user.uid, 'emergencyFund', 'current');
      const newAmount = emergencyFund.currentAmount + amount;
      await updateDoc(docRef, {
        currentAmount: newAmount,
        updatedAt: new Date(),
      });
      await addEmergencyFundContribution(user.uid, amount);
      return newAmount;
    },
    onSuccess: (newAmount) => {
      queryClient.invalidateQueries({ queryKey: ['emergencyFund', user?.uid] });
      setShowAddFundsModal(false);
      setAddAmount("");
      refetchContributions();
      const amountAdded = parseFloat(addAmount);
      toast({
        title: "Funds Added!",
        description: `Successfully added £${amountAdded.toFixed(2)} to your emergency fund.`,
      });
    },
    onError: (error) => {
      console.error('Add to emergency fund error:', error);
      toast({
        title: "Error",
        description: "Failed to add funds. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateFund = () => {
    createFundMutation.mutate({
      currentAmount: 0,
      targetAmount: setupData.targetAmount,
      monthlyContribution: setupData.monthlyContribution,
      targetMonths: setupData.targetMonths,
    });
  };

  const handleAddFunds = () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than £0.",
        variant: "destructive",
      });
      return;
    }
    addToFundMutation.mutate(amount);
  };

  const handleQuickAdd = (amount: number) => {
    addToFundMutation.mutate(amount);
  };

  // Handle timeline change
  const handleTimelineChange = (newTimeline: string) => {
    const timeline = parseInt(newTimeline);
    setSelectedTimeline(timeline);
    // Update the emergency fund target months
    if (emergencyFund && user?.uid) {
      const docRef = doc(db, 'users', user.uid, 'emergencyFund', 'current');
      updateDoc(docRef, {
        targetMonths: timeline,
        updatedAt: new Date(),
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['emergencyFund', user?.uid] });
      });
    }
  };

  // Helper to get milestone achievement date
  const getMilestoneDate = (amount: number) => {
    if (!contributions) return null;
    let sum = 0;
    for (const c of contributions) {
      sum += (c as any).amount;
      if (sum >= amount) {
        return new Date(c.date);
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!emergencyFund) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Emergency Fund</h3>
            <p className="text-gray-600 mb-6">
              Set up your emergency fund to prepare for unexpected expenses. 
              Financial experts recommend saving 3-6 months of expenses.
            </p>
            
            <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
              <DialogTrigger asChild>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Target className="mr-2 h-4 w-4" />
                  Set Up Emergency Fund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Up Your Emergency Fund</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="targetAmount">Target Amount (£)</Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      value={setupData.targetAmount}
                      onChange={(e) => setSetupData(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                      placeholder="15000"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Recommended: 3-6 months of expenses
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="monthlyContribution">Monthly Contribution (£)</Label>
                    <Input
                      id="monthlyContribution"
                      type="number"
                      value={setupData.monthlyContribution}
                      onChange={(e) => setSetupData(prev => ({ ...prev, monthlyContribution: parseFloat(e.target.value) || 0 }))}
                      placeholder="500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="targetMonths">Target Months Coverage</Label>
                    <Input
                      id="targetMonths"
                      type="number"
                      value={setupData.targetMonths}
                      onChange={(e) => setSetupData(prev => ({ ...prev, targetMonths: parseFloat(e.target.value) || 6 }))}
                      placeholder="6"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleCreateFund}
                    disabled={createFundMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {createFundMutation.isPending ? "Creating..." : "Create Emergency Fund"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { currentAmount, targetAmount, targetMonths } = emergencyFund;
  const percentage = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const remaining = Math.max(targetAmount - currentAmount, 0);
  const monthlyExpenses = targetAmount / targetMonths;
  const monthsOfExpenses = monthlyExpenses > 0 ? currentAmount / monthlyExpenses : 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Emergency Fund</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show Emergency Fund</span>
              <Switch checked={isOpen} onCheckedChange={setIsOpen} />
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
        {isOpen && (
          <>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{percentage.toFixed(1)}%</span>
              </div>
              <Progress value={percentage} className="h-3 mb-3" />
              
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">
                  {getDaysCovered()} days of expenses covered
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Goal: {emergencyFund?.targetMonths || 6} months coverage
                </div>
                
                {/* Progress Nudge */}
                <div className="text-xs text-blue-600 font-medium mb-2">
                  {getProgressNudge()}
                </div>
                
                {/* Missed Target Warning */}
                {(() => {
                  const monthlyTarget = getMonthlyTarget();
                  const currentMonthProgress = getCurrentMonthProgress();
                  const behind = monthlyTarget - currentMonthProgress;
                  if (behind > 0) {
                    return (
                      <span className="inline-flex items-center bg-red-100 text-red-700 px-4 py-2 rounded-lg text-base font-semibold mb-3 mt-2 shadow-sm">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        £{behind.toLocaleString()} behind target this month
                      </span>
                    );
                  }
                  return null;
                })()}
                
                {/* Milestones - horizontally scrollable on mobile */}
                <div className="flex flex-nowrap overflow-x-auto gap-3 mb-3 py-2 justify-center scrollbar-hide">
                  {getMilestones().map((milestone, index) => {
                    const achieved = currentAmount >= milestone.amount;
                    const date = getMilestoneDate(milestone.amount);
                    return (
                      <TooltipProvider key={index}>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className={clsx(
                              "inline-flex items-center px-4 py-2 rounded-full font-semibold cursor-pointer border transition-colors duration-150",
                              achieved
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 shadow"
                                : "bg-gray-100 text-gray-400 border-gray-200 opacity-80"
                            )}
                            style={{ fontSize: '1.1rem', minWidth: 'max-content' }}
                            tabIndex={0}
                            >
                              <span className="mr-2 text-lg">{milestone.icon}</span> {milestone.label}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-base">
                            <div>
                              <strong>Milestone:</strong> £{milestone.amount.toLocaleString()}<br />
                              {achieved ? (
                                <>Achieved: {date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "(date unknown)"}</>
                              ) : (
                                <>Not yet achieved</>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
                
                {/* Next Milestone with Top-up Now */}
                {getNextMilestone() && (
                  <div className="text-base text-gray-700 flex items-center justify-center gap-3 flex-wrap font-semibold mb-3 mt-2">
                    <span className="flex items-center gap-2">
                      Next: <span className="text-lg">{getNextMilestone()?.icon}</span> {getNextMilestone()?.label} (
                      need <span className="font-bold text-primary text-lg">£{(getNextMilestone()?.amount || 0) - currentAmount}</span> more)
                    </span>
                    <Button
                      size="lg"
                      className="ml-1 px-4 py-2 h-10 text-base bg-primary text-white font-bold rounded-full shadow"
                      onClick={() => {
                        setAddAmount(((getNextMilestone()?.amount || 0) - currentAmount).toString());
                        setShowAddFundsModal(true);
                      }}
                    >
                      Top-up Now
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Control */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Timeline</span>
                <Select value={selectedTimeline.toString()} onValueChange={handleTimelineChange}>
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="9">9 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bar Graph for Contributions */}
            <div className="my-6 w-full max-w-3xl mx-auto overflow-x-auto">
              <h4 className="text-md font-semibold mb-2">Progress Timeline ({selectedTimeline} months)</h4>
              <div className="text-xs text-gray-500 mb-3">
                Assumes even monthly deposits of £{getMonthlyTarget().toFixed(0)}
              </div>
              <div style={{ minWidth: 700 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }} barCategoryGap={32} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 14, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 13, fontWeight: 500 }} />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'actual') return [`£${value.toLocaleString()}`, 'Actual Invested'];
                        if (name === 'target') return [`£${value.toLocaleString()}`, 'Required This Month'];
                        if (name === 'remaining') return [`£${value.toLocaleString()}`, 'Remaining to Invest'];
                        return [`£${value.toLocaleString()}`, name];
                      }}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar dataKey="target" fill="#cbd5e1" name="Required This Month" />
                    <Bar dataKey="actual" fill="#22c55e" name="Actual Invested" />
                    <Bar dataKey="remaining" fill="#f59e0b" name="Remaining to Invest" />
                    {goalHitMonthIndex !== null && (
                      <ReferenceLine x={monthlyData[goalHitMonthIndex]?.monthLabel} stroke="#3b82f6" strokeDasharray="4 2">
                        <RechartsLabel value="Goal Hit Here!" position="top" fill="#3b82f6" fontSize={14} fontWeight={700} />
                      </ReferenceLine>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Mini Legend for Graph */}
              <div className="flex items-center gap-4 mt-2 justify-center text-xs flex-wrap">
                <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-2 rounded-sm bg-cbd5e1"></span> Required This Month</span>
                <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-2 rounded-sm bg-emerald-500"></span> Actual Invested</span>
                <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-2 rounded-sm bg-yellow-500"></span> Remaining to Invest</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 flex flex-wrap items-center gap-4">
                <span className="inline-block mr-2">Total Saved: <span className="font-semibold text-emerald-600">£{totalInvested.toLocaleString()}</span></span>
                <span className="inline-block mr-2">Target: <span className="font-semibold text-blue-600">£{(emergencyFund?.targetAmount || 0).toLocaleString()}</span></span>
                <span className="inline-block mr-2">This Month: <span className="font-semibold text-orange-600">£{monthlyData[monthlyData.findIndex(m => m.monthLabel === new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }))]?.actual?.toLocaleString() || 0}</span></span>
                <span className="inline-block">Required per Month: <span className="font-semibold text-blue-600">£{Math.round(newRequiredMonthly).toLocaleString()}</span></span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Current Amount</span>
                <span className="font-semibold">£{currentAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Target ({targetMonths} months)</span>
                <span className="font-semibold">£{targetAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-600 text-sm">Remaining</span>
                <span className="font-semibold text-emerald-600">
                  £{remaining.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4 md:grid-cols-3 sm:grid-cols-1">
              {[50, 100, 250].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="lg"
                  onClick={() => handleQuickAdd(amount)}
                  disabled={addToFundMutation.isPending}
                  className="text-xs md:text-base py-3"
                >
                  +£{amount}
                </Button>
              ))}
            </div>

            <Dialog open={showAddFundsModal} onOpenChange={setShowAddFundsModal}>
              <DialogTrigger asChild>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add to Fund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add to Emergency Fund</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="addAmount">Amount to Add (£)</Label>
                    <Input
                      id="addAmount"
                      type="number"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      placeholder="Enter amount..."
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setAddAmount("100")}
                      className="flex-1"
                    >
                      £100
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAddAmount("250")}
                      className="flex-1"
                    >
                      £250
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAddAmount("500")}
                      className="flex-1"
                    >
                      £500
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleAddFunds}
                    disabled={addToFundMutation.isPending || !addAmount}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {addToFundMutation.isPending ? "Adding..." : `Add £${addAmount || "0"} to Fund`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}