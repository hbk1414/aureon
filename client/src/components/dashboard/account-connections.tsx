import { Plus, University, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ConnectedAccount } from "@shared/schema";

interface AccountConnectionsProps {
  accounts: ConnectedAccount[];
}

export default function AccountConnections({ accounts }: AccountConnectionsProps) {
  const handleConnectAccount = () => {
    // TODO: Implement account connection modal
    console.log('Open account connection modal');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Connected Accounts</h3>
          <Button onClick={handleConnectAccount} className="bg-primary text-white hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Connect Account
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <div 
              key={account.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                    account.accountType.includes('Credit') 
                      ? 'bg-red-600' 
                      : 'bg-blue-600'
                  }`}>
                    {account.accountType.includes('Credit') ? (
                      <CreditCard className="text-white w-5 h-5" />
                    ) : (
                      <University className="text-white w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{account.bankName}</div>
                    <div className="text-sm text-gray-600">{account.accountType}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${
                    parseFloat(account.balance) >= 0 ? 'text-gray-800' : 'text-danger'
                  }`}>
                    £{Math.abs(parseFloat(account.balance)).toLocaleString()}
                  </div>
                  <div className="text-xs text-success">Connected</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
