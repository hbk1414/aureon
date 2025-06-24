import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmergencyFundProps {
  emergencyFund: {
    current: number;
    goal: number;
    percentage: number;
    remaining: number;
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

  // Provide safe defaults for all properties
  const safeEmergencyFund = {
    currentAmount: emergencyFund.currentAmount || 0,
    targetAmount: emergencyFund.targetAmount || 15000,
    monthsOfExpenses: emergencyFund.monthsOfExpenses || 0,
    targetMonths: emergencyFund.targetMonths || 6,
    monthlyContribution: emergencyFund.monthlyContribution || 0,
    current: emergencyFund.currentAmount || 0,
    goal: emergencyFund.targetAmount || 15000,
    remaining: Math.max((emergencyFund.targetAmount || 15000) - (emergencyFund.currentAmount || 0), 0),
    percentage: emergencyFund.targetAmount ? Math.min((emergencyFund.currentAmount || 0) / emergencyFund.targetAmount * 100, 100) : 0
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Fund</h3>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{emergencyFund.percentage}%</span>
          </div>
          <Progress value={emergencyFund.percentage} className="h-3" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Current</span>
            <span className="font-semibold">£{emergencyFund.current.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Goal (3 months)</span>
            <span className="font-semibold">£{emergencyFund.goal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="text-gray-600 text-sm">Remaining</span>
            <span className="font-semibold text-primary">
              £{emergencyFund.remaining.toLocaleString()}
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
