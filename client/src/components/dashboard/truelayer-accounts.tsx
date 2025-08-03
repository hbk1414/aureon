import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  PiggyBank, 
  ChevronDown, 
  ChevronUp,
  Building2,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

interface TrueLayerAccount {
  account_id: string;
  account_type: string;
  display_name: string;
  currency: string;
  balance?: number;
  account_number: {
    number: string;
    sort_code: string;
    iban?: string;
  };
  provider: {
    display_name: string;
    provider_id: string;
    logo_uri?: string;
  };
}

interface TrueLayerTransaction {
  transaction_id: string;
  amount: number;
  currency: string;
  description: string;
  transaction_type: "DEBIT" | "CREDIT";
  transaction_category?: string;
  timestamp: string;
  merchant_name?: string;
}

interface TrueLayerAccountsProps {
  className?: string;
}

export default function TrueLayerAccounts({ className }: TrueLayerAccountsProps) {
  const [accounts, setAccounts] = useState<TrueLayerAccount[]>([]);
  const [transactions, setTransactions] = useState<Record<string, TrueLayerTransaction[]>>({});
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState<Record<string, boolean>>({});
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      const accountsList = data.results || [];
      
      setAccounts(accountsList);

      // Fetch balances for all accounts
      await fetchAllBalances(accountsList);
      
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Failed to load accounts",
        description: "Could not retrieve bank account data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBalances = async (accountsList: TrueLayerAccount[]) => {
    const balancePromises = accountsList.map(async (account) => {
      try {
        const response = await fetch(`/api/accounts/${account.account_id}/balance`);
        
        if (response.ok) {
          const balanceData = await response.json();
          return { accountId: account.account_id, balance: balanceData.results[0]?.current || 0 };
        }
      } catch (error) {
        console.error(`Error fetching balance for ${account.account_id}:`, error);
      }
      return { accountId: account.account_id, balance: 0 };
    });

    const balanceResults = await Promise.all(balancePromises);
    const balancesMap = balanceResults.reduce((acc, result) => {
      acc[result.accountId] = result.balance;
      return acc;
    }, {} as Record<string, number>);
    
    setBalances(balancesMap);
  };

  const fetchTransactions = async (accountId: string) => {
    if (transactions[accountId]) {
      return; // Already loaded
    }

    setLoadingTransactions(prev => ({ ...prev, [accountId]: true }));

    try {
      const response = await fetch(`/api/accounts/${accountId}/transactions`);

      if (response.ok) {
        const transactionData = await response.json();
        setTransactions(prev => ({
          ...prev,
          [accountId]: transactionData.results || []
        }));
      }
    } catch (error) {
      console.error(`Error fetching transactions for ${accountId}:`, error);
      toast({
        title: "Failed to load transactions",
        description: "Could not retrieve transaction data",
        variant: "destructive"
      });
    } finally {
      setLoadingTransactions(prev => ({ ...prev, [accountId]: false }));
    }
  };



  const toggleAccountExpansion = async (accountId: string) => {
    const isExpanding = !expandedAccounts[accountId];
    
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: isExpanding
    }));

    if (isExpanding) {
      await fetchTransactions(accountId);
    }
  };

  const formatAccountNumber = (accountNumber: string) => {
    return `****${accountNumber.slice(-4)}`;
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === 'GBP' ? '£' : currency;
    return `${symbol}${Math.abs(amount).toFixed(2)}`;
  };

  const getAccountIcon = (accountType: string) => {
    switch (accountType.toLowerCase()) {
      case 'savings':
        return <PiggyBank className="h-5 w-5" />;
      case 'transaction':
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getTransactionIcon = (type: string) => {
    return type === 'CREDIT' ? (
      <ArrowDownLeft className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-red-600" />
    );
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-8 border rounded-lg border-dashed border-gray-300">
          <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No bank accounts connected through TrueLayer.</p>
          <Button 
            onClick={() => window.open('/auth', '_blank')} 
            variant="outline"
          >
            Connect Bank Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {accounts.map((account) => (
          <motion.div
            key={account.account_id}
            layout
            className="border rounded-lg p-4 space-y-3"
          >
            {/* Account Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getAccountIcon(account.account_type)}
                <div>
                  <div className="font-medium">
                    {account.provider.display_name} - {account.account_type}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatAccountNumber(account.account_number.number)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 font-semibold text-lg">
                  <span className="text-sm">£</span>
                  {balances[account.account_id]?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {account.currency}
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>Sort Code: {account.account_number.sort_code}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleAccountExpansion(account.account_id)}
                className="h-auto p-1"
              >
                {expandedAccounts[account.account_id] ? (
                  <>
                    Hide Transactions <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    View Transactions <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {/* Transactions */}
            <AnimatePresence>
              {expandedAccounts[account.account_id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-3">Recent Transactions</h4>
                    
                    {loadingTransactions[account.account_id] ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : transactions[account.account_id]?.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {transactions[account.account_id].slice(0, 10).map((transaction) => (
                          <div
                            key={transaction.transaction_id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(transaction.transaction_type)}
                              <div>
                                <div className="font-medium text-sm">
                                  {transaction.merchant_name || transaction.description}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(transaction.timestamp), 'MMM dd, yyyy')}
                                  {transaction.transaction_category && (
                                    <Badge variant="outline" className="text-xs py-0">
                                      {transaction.transaction_category}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={`font-semibold ${
                              transaction.transaction_type === 'CREDIT' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {transaction.transaction_type === 'CREDIT' ? '+' : '-'}
                              {formatAmount(transaction.amount, transaction.currency)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No transactions found</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}