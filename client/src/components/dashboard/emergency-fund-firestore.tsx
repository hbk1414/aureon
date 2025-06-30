import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { PlusCircle, Target, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
      
      return newAmount;
    },
    onSuccess: (newAmount) => {
      queryClient.invalidateQueries({ queryKey: ['emergencyFund', user?.uid] });
      setShowAddFundsModal(false);
      setAddAmount("");
      
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
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{percentage.toFixed(1)}%</span>
          </div>
          <Progress value={percentage} className="h-3 mb-3" />
          
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">
              {monthsOfExpenses.toFixed(1)} months of expenses saved
            </div>
            <div className="text-xs text-gray-500">
              Goal: {targetMonths} months coverage
            </div>
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
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[50, 100, 250].map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd(amount)}
              disabled={addToFundMutation.isPending}
              className="text-xs"
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
      </CardContent>
    </Card>
  );
}