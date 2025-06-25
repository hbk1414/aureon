import { useState } from "react";
import { Plus, Building, CreditCard, TrendingUp, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { removeAccountFromUser } from "@/lib/firestore";
import ConnectAccountModal from "./connect-account-modal";
import { useQueryClient } from "@tanstack/react-query";

interface Account {
  bankName: string;
  type: string;
  balance: number;
  last4: string;
  connectedAt?: string;
}

interface AccountConnectionsProps {
  accounts: Account[];
}

export default function AccountConnections({ accounts }: AccountConnectionsProps) {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(balance);
  };

  const getBankLogo = (bankName: string) => {
    const bankLogos: { [key: string]: string } = {
      'Barclays': '🏦', // Blue bank building
      'HSBC': '🔴', // Red circle
      'Lloyds': '🐎', // Black horse
      'NatWest': '💜', // Purple
      'Santander': '🔥', // Red flame
      'TSB': '💙', // Blue heart
      'Nationwide': '🏠', // House
      'Halifax': '❌', // X mark
      'First Direct': '1️⃣', // Number 1
      'Monzo': '🌟', // Hot coral star
      'Starling': '⭐', // Star
      'Revolut': '🚀', // Rocket
      'Chase': '🔷', // Blue diamond
      'Virgin Money': '🔴', // Red circle
      'Metro Bank': '🌈', // Rainbow
    };
    
    return bankLogos[bankName] || '🏛️'; // Default bank building
  };

  const handleRemoveAccount = async (index: number) => {
    if (!user?.uid) return;
    
    setRemovingIndex(index);
    try {
      await removeAccountFromUser(user.uid, index);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['/api/dashboard', user.uid]
      });
      
      toast({
        title: "Success",
        description: "Account removed successfully",
      });
    } catch (error) {
      console.error("Error removing account:", error);
      toast({
        title: "Error",
        description: "Failed to remove account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemovingIndex(null);
    }
  };

  const handleAccountAdded = () => {
    // Invalidate queries to refresh data
    if (user?.uid) {
      queryClient.invalidateQueries({
        queryKey: ['/api/dashboard', user.uid]
      });
    }
  };

  const handleConnectClick = () => {
    console.log("Connect account button clicked");
    setShowConnectModal(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Connected Accounts
            </span>
            <Button size="sm" onClick={handleConnectClick}>
              <Plus className="mr-2 h-4 w-4" />
              Connect Account
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accounts && accounts.length > 0 ? (
            <div className="space-y-4">
              {accounts.map((account, index) => (
                <div 
                  key={`${account.bankName}-${account.last4}-${index}`} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                      {getBankLogo(account.bankName)}
                    </div>
                    <div>
                      <p className="font-medium">{account.bankName}</p>
                      <p className="text-sm text-gray-500">
                        {account.type} • •••• {account.last4}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatBalance(account.balance)}</p>
                      <p className="text-sm text-gray-500">
                        {account.connectedAt ? 
                          `Connected ${new Date(account.connectedAt).toLocaleDateString()}` :
                          'Recently connected'
                        }
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAccount(index)}
                      disabled={removingIndex === index}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {removingIndex === index ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts connected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Connect your bank accounts to get started with financial tracking.
              </p>
              <div className="mt-6">
                <Button onClick={handleConnectClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Your First Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConnectAccountModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
        onAccountAdded={handleAccountAdded}
      />
    </>
  );
}
