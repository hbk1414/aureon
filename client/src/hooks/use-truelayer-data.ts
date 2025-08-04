import { useState, useEffect } from 'react';

interface TrueLayerAccount {
  account_id: string;
  account_type: string;
  display_name: string;
  currency: string;
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

interface TrueLayerBalance {
  currency: string;
  current: number;
  available: number;
  overdraft: number;
}

interface ProcessedData {
  totalBalance: number;
  totalIncome: number;
  totalSpent: number;
  accounts: TrueLayerAccount[];
  balances: Record<string, TrueLayerBalance>;
  transactions: Record<string, TrueLayerTransaction[]>;
  spendingCategories: Array<{
    name: string;
    amount: number;
    transactions: number;
    percentage: number;
  }>;
  incomeCategories: Array<{
    name: string;
    amount: number;
    transactions: number;
  }>;
}

export function useTrueLayerData() {
  const [data, setData] = useState<ProcessedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrueLayerData();
  }, []);

  const fetchTrueLayerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch accounts
      const accountsResponse = await fetch('/api/accounts');
      if (!accountsResponse.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      const accountsData = await accountsResponse.json();
      const accounts: TrueLayerAccount[] = accountsData.results || [];

      // Fetch balances for all accounts
      const balances: Record<string, TrueLayerBalance> = {};
      const balancePromises = accounts.map(async (account) => {
        try {
          const response = await fetch(`/api/accounts/${account.account_id}/balance`);
          if (response.ok) {
            const balanceData = await response.json();
            if (balanceData.results?.[0]) {
              balances[account.account_id] = balanceData.results[0];
            }
          }
        } catch (error) {
          console.error(`Error fetching balance for ${account.account_id}:`, error);
        }
      });

      await Promise.all(balancePromises);

      // Fetch transactions for all accounts
      const transactions: Record<string, TrueLayerTransaction[]> = {};
      const transactionPromises = accounts.map(async (account) => {
        try {
          const response = await fetch(`/api/accounts/${account.account_id}/transactions`);
          if (response.ok) {
            const transactionData = await response.json();
            transactions[account.account_id] = transactionData.results || [];
          }
        } catch (error) {
          console.error(`Error fetching transactions for ${account.account_id}:`, error);
        }
      });

      await Promise.all(transactionPromises);

      // Process the data
      const processedData = processTrueLayerData(accounts, balances, transactions);
      setData(processedData);

    } catch (error) {
      console.error('Error fetching TrueLayer data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const processTrueLayerData = (
    accounts: TrueLayerAccount[],
    balances: Record<string, TrueLayerBalance>,
    transactions: Record<string, TrueLayerTransaction[]>
  ): ProcessedData => {
    // Calculate total balance
    const totalBalance = Object.values(balances).reduce((sum, balance) => sum + balance.current, 0);

    // Process all transactions
    const allTransactions = Object.values(transactions).flat();
    
    // Calculate total income and spending
    let totalIncome = 0;
    let totalSpent = 0;
    
    // Group transactions by category for spending
    const spendingByCategory: Record<string, { amount: number; count: number }> = {};
    const incomeByCategory: Record<string, { amount: number; count: number }> = {};

    allTransactions.forEach(transaction => {
      if (transaction.transaction_type === 'CREDIT') {
        totalIncome += transaction.amount;
        const category = transaction.merchant_name || 'Other Income';
        if (!incomeByCategory[category]) {
          incomeByCategory[category] = { amount: 0, count: 0 };
        }
        incomeByCategory[category].amount += transaction.amount;
        incomeByCategory[category].count += 1;
      } else if (transaction.transaction_type === 'DEBIT') {
        totalSpent += Math.abs(transaction.amount);
        const category = categorizeTransaction(transaction);
        if (!spendingByCategory[category]) {
          spendingByCategory[category] = { amount: 0, count: 0 };
        }
        spendingByCategory[category].amount += Math.abs(transaction.amount);
        spendingByCategory[category].count += 1;
      }
    });

    // Convert spending categories to array with percentages
    const spendingCategories = Object.entries(spendingByCategory).map(([name, data]) => ({
      name,
      amount: data.amount,
      transactions: data.count,
      percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);

    // Convert income categories to array
    const incomeCategories = Object.entries(incomeByCategory).map(([name, data]) => ({
      name,
      amount: data.amount,
      transactions: data.count
    })).sort((a, b) => b.amount - a.amount);

    return {
      totalBalance,
      totalIncome,
      totalSpent,
      accounts,
      balances,
      transactions,
      spendingCategories,
      incomeCategories
    };
  };

  const categorizeTransaction = (transaction: TrueLayerTransaction): string => {
    const description = transaction.description.toLowerCase();
    const merchantName = transaction.merchant_name?.toLowerCase() || '';

    if (description.includes('tesco') || description.includes('sainsbury') || description.includes('asda') || merchantName.includes('tesco') || merchantName.includes('sainsbury')) {
      return 'Groceries';
    }
    if (description.includes('shell') || description.includes('petrol') || description.includes('fuel') || merchantName.includes('shell')) {
      return 'Transport';
    }
    if (description.includes('netflix') || description.includes('spotify') || description.includes('disney') || merchantName.includes('netflix') || merchantName.includes('spotify')) {
      return 'Subscriptions';
    }
    if (description.includes('coffee') || description.includes('starbucks') || description.includes('costa') || merchantName.includes('starbucks') || merchantName.includes('costa')) {
      return 'Dining';
    }
    if (description.includes('amazon') || merchantName.includes('amazon')) {
      return 'Shopping';
    }
    if (description.includes('rent') || description.includes('council') || description.includes('gas') || description.includes('electric') || description.includes('internet')) {
      return 'Bills';
    }
    if (description.includes('bus') || description.includes('tfl') || merchantName.includes('tfl')) {
      return 'Transport';
    }
    
    return 'Other';
  };

  return { data, loading, error, refetch: fetchTrueLayerData };
}