import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

  const addToFundMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest("POST", "/api/emergency-fund/1/add", { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/1"] });
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
