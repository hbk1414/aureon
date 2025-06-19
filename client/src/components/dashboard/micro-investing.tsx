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

  if (!investingAccount) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Micro-Investing</h3>
          <p className="text-gray-600">Set up micro-investing to start building wealth with spare change.</p>
        </CardContent>
      </Card>
    );
  }

  const roundUpTransactions = recentTransactions
    .filter(t => t.roundUp && parseFloat(t.roundUp) > 0)
    .slice(0, 3);

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
              checked={investingAccount.roundUpEnabled}
              onCheckedChange={handleToggleRoundUp}
              disabled={toggleRoundUpMutation.isPending}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              £{parseFloat(investingAccount.monthlyRoundUps).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">This Month's Round-ups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              £{parseFloat(investingAccount.totalInvested).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Invested</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              +£{parseFloat(investingAccount.totalReturns).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Returns</div>
          </div>
        </div>

        {roundUpTransactions.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Coins className="text-primary mr-2 w-5 h-5" />
              <span className="font-medium text-gray-800">Recent Round-ups</span>
            </div>
            <div className="space-y-2 text-sm">
              {roundUpTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between">
                  <span className="text-gray-600">{transaction.merchant}</span>
                  <span className="text-primary font-medium">
                    +£{parseFloat(transaction.roundUp || "0").toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
