import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { addEmergencyFundContribution, getEmergencyFundContributions } from "@/lib/firestore";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useEffect } from "react";

interface EmergencyFundProps {
  emergencyFund: {
    currentAmount?: number;
    targetAmount?: number;
    monthsOfExpenses?: number;
    targetMonths?: number;
    monthlyContribution?: number;
    current?: number;
    goal?: number;
    percentage?: number;
    remaining?: number;
  } | null;
}

export default function EmergencyFund({ emergencyFund }: EmergencyFundProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch contributions
  const { data: contributions = [], refetch } = useQuery({
    queryKey: ["emergencyFundContributions", user?.uid],
    queryFn: () => user?.uid ? getEmergencyFundContributions(user.uid) : Promise.resolve([]),
    enabled: !!user?.uid,
  });

  // Calculate monthly data for the bar graph
  let monthlyData: { month: string; total: number }[] = [];
  let totalInvested = 0;
  if (contributions.length > 0) {
    // Group by month
    const grouped: Record<string, number> = {};
    contributions.forEach((c: any) => {
      const d = new Date(c.date);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      grouped[key] = (grouped[key] || 0) + c.amount;
      totalInvested += c.amount;
    });
    // Sort months
    monthlyData = Object.entries(grouped).map(([month, total]) => ({ month, total }));
    monthlyData.sort((a, b) => a.month.localeCompare(b.month));
  }

  const addToFundMutation = useMutation({
    mutationFn: async (amount: number) => {
      await apiRequest("POST", "/api/emergency-fund/1/add", { amount });
      if (user?.uid) {
        await addEmergencyFundContribution(user.uid, amount);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/1"] });
      queryClient.invalidateQueries({ queryKey: ["emergencyFundContributions", user?.uid] });
      refetch();
      toast({
        title: "Success",
        description: "Emergency fund updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update emergency fund",
        variant: "destructive",
      });
    },
  });

  const handleAddToFund = () => {
    // Add £150 as suggested by AI
    addToFundMutation.mutate(150);
  };

  if (!emergencyFund) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Fund</h3>
          <p className="text-gray-600 mb-4">Set up your emergency fund to prepare for unexpected expenses.</p>
          <Button className="w-full bg-success text-white hover:bg-green-700">
            Create Emergency Fund
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Create safe defaults for all emergency fund properties
  const current = emergencyFund?.current ?? emergencyFund?.currentAmount ?? 0;
  const goal = emergencyFund?.goal ?? emergencyFund?.targetAmount ?? 15000;
  const remaining = Math.max(goal - current, 0);
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const monthsOfExpenses = emergencyFund?.monthsOfExpenses ?? 0;
  const targetMonths = emergencyFund?.targetMonths ?? 6;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Fund</h3>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{percentage.toFixed(1)}%</span>
          </div>
          <div className="text-center text-sm text-gray-600 mb-2">
            {monthsOfExpenses.toFixed(1)} months of expenses saved
          </div>
          <div className="text-center text-xs text-gray-500 mb-3">
            Goal: {targetMonths} months
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        {/* Bar Graph for Contributions */}
        <div className="my-6">
          <h4 className="text-md font-semibold mb-2">Monthly Contributions</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: any) => `£${value}`} />
              <Bar dataKey="total" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-xs text-gray-500 mt-2">Total Invested: <span className="font-semibold text-primary">£{totalInvested.toLocaleString()}</span></div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Current</span>
            <span className="font-semibold">£{current.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Goal ({targetMonths} months)</span>
            <span className="font-semibold">£{goal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="text-gray-600 text-sm">Remaining</span>
            <span className="font-semibold text-primary">
              £{remaining.toLocaleString()}
            </span>
          </div>
        </div>

        <Button 
          onClick={handleAddToFund}
          disabled={addToFundMutation.isPending}
          className="w-full bg-success text-white hover:bg-green-700 mt-4"
        >
          {addToFundMutation.isPending ? "Adding..." : "Add to Emergency Fund"}
        </Button>
      </CardContent>
    </Card>
  );
}
