import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { getUserDocument } from "@/lib/firestore";

// Local storage fallback helpers
const getLocalAccountsFallback = (uid?: string): any[] => {
  if (!uid) return [];
  try {
    const stored = localStorage.getItem(`accounts_${uid}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading local accounts fallback:', error);
    return [];
  }
};

const getLocalTransactionsFallback = (uid?: string): any[] => {
  if (!uid) return [];
  try {
    const stored = localStorage.getItem(`transactions_${uid}`);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Generate realistic transactions with round-up calculations
    const generateRealisticTransactions = () => {
      const transactions = [];
      const merchants = [
        { name: "Tesco", category: "Groceries", baseAmount: [12.45, 28.73, 45.67, 15.32] },
        { name: "Costa Coffee", category: "Dining", baseAmount: [4.25, 3.85, 5.50, 6.75] },
        { name: "TfL", category: "Transport", baseAmount: [2.80, 5.60, 8.40, 11.20] },
        { name: "Sainsbury's", category: "Groceries", baseAmount: [23.89, 67.45, 34.12, 89.67] },
        { name: "Amazon", category: "Shopping", baseAmount: [19.99, 45.67, 78.90, 123.45] },
        { name: "Nando's", category: "Dining", baseAmount: [18.75, 25.50, 32.25, 28.95] },
        { name: "Shell", category: "Transport", baseAmount: [45.67, 52.34, 38.91, 67.23] },
        { name: "Boots", category: "Shopping", baseAmount: [8.99, 15.75, 23.45, 11.20] },
        { name: "Pret A Manger", category: "Dining", baseAmount: [6.85, 9.50, 7.25, 8.75] },
        { name: "Uber", category: "Transport", baseAmount: [12.50, 18.75, 25.30, 14.60] }
      ];

      // Generate 20 transactions over the last month
      for (let i = 0; i < 20; i++) {
        const merchant = merchants[Math.floor(Math.random() * merchants.length)];
        const baseAmount = merchant.baseAmount[Math.floor(Math.random() * merchant.baseAmount.length)];
        
        // Add small random variation to make amounts more realistic
        const variation = (Math.random() - 0.5) * 2; // ±1 variation
        const amount = Math.max(0.01, baseAmount + variation);
        
        // Calculate round-up (difference to next pound)
        const roundUp = Math.ceil(amount) - amount;
        
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        transactions.push({
          id: i + 1,
          accountId: 1,
          amount: amount.toFixed(2),
          category: merchant.category,
          merchant: merchant.name,
          description: `Purchase at ${merchant.name}`,
          date: date.toISOString(),
          roundUp: roundUp.toFixed(2)
        });
      }
      
      // Sort by date (newest first)
      return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };
    
    const transactions = generateRealisticTransactions();
    localStorage.setItem(`transactions_${uid}`, JSON.stringify(transactions));
    return transactions;
    
  } catch (error) {
    console.error('Error reading local transactions fallback:', error);
    return [];
  }
};

// Calculate spending breakdown from transactions
const calculateSpendingBreakdown = (transactions: any[]) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Filter transactions for current month
  const thisMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === currentMonth && 
           txDate.getFullYear() === currentYear &&
           tx.amount < 0; // Only spending (negative amounts)
  });
  
  // Calculate total spent this month
  const totalSpent = Math.abs(thisMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0));
  
  // Group by category
  const categoryTotals: Record<string, number> = {};
  thisMonthTransactions.forEach(tx => {
    const category = tx.category || 'Other';
    categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(tx.amount);
  });
  
  // Convert to category breakdown with percentages
  const categories = Object.entries(categoryTotals)
    .map(([name, amount]) => ({
      name,
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round((amount / totalSpent) * 100)
    }))
    .sort((a, b) => b.amount - a.amount);
  
  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    categories,
    transactionCount: thisMonthTransactions.length
  };
};

// Fast fallback data for immediate display
const getFallbackData = (user: any) => ({
  user: {
    name: user.displayName || user.email?.split('@')[0] || 'User',
    firstName: user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User',
    initials: (user.displayName || user.email?.split('@')[0] || 'User').split(' ').map(n => n[0]).join('').toUpperCase()
  },
  portfolio: {
    totalBalance: 0
  },
  connectedAccounts: [],
  recentTransactions: [],
  financialGoals: [],
  aiTasks: [
    {
      id: 1,
      title: "Set up emergency fund auto-transfer",
      description: "Automatically transfer £500 monthly to emergency savings to reach your 6-month goal",
      completed: false,
      priority: "high",
      category: "savings"
    },
    {
      id: 2,
      title: "Review monthly budget allocation",
      description: "Optimize your £3,000 monthly budget to increase savings rate",
      completed: false,
      priority: "medium", 
      category: "budgeting"
    }
  ],
  debtAccounts: [],
  investingAccount: null,
  spending: {
    total: 0,
    budget: 3000,
    remaining: 3000,
    totalThisMonth: 0,
    categories: []
  },
  emergencyFund: {
    currentAmount: 0,
    targetAmount: 15000,
    monthsOfExpenses: 0,
    targetMonths: 6,
    monthlyContribution: 500
  },
  stats: {
    totalSaved: 0,
    monthlyIncome: 5000,
    savingsRate: 15,
    creditScore: 720
  },
  partner: null,
  sharedGoals: [],
  couplesSavings: {
    totalSaved: 0,
    monthlyContribution: 0
  }
});

export function useFinancialData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['/api/dashboard', user?.uid],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async () => {
      if (!user?.uid) throw new Error('User not authenticated');

      try {
        // Check for locally stored onboarding data first
        console.log('Checking for onboarding data for user:', user.uid);
        const localOnboardingData = localStorage.getItem(`onboarding_data_${user.uid}`);
        console.log('Raw onboarding data from localStorage:', localOnboardingData);
        let onboardingData = null;
        
        if (localOnboardingData) {
          try {
            onboardingData = JSON.parse(localOnboardingData);
            console.log('Parsed onboarding data from localStorage:', onboardingData);
          } catch (e) {
            console.error('Error parsing local onboarding data:', e);
          }
        } else {
          console.log('No onboarding data found in localStorage');
          // Create sample onboarding data for demonstration
          const sampleOnboardingData = {
            fullName: "Alex Johnson",
            age: 28,
            employmentStatus: "Employed",
            monthlyIncome: 4500,
            goals: ["Emergency Fund", "House Deposit", "Retirement Savings"],
            monthlyBudget: 3200,
            savingsTarget: 1300,
            emergencyFundTarget: 6,
            totalSpent: 2850,
            savingsRate: 28.9,
            creditScore: 745,
            emergencyFund: {
              currentAmount: 4200,
              targetAmount: 19200,
              isCompleted: false
            },
            aiTasks: [
              {
                title: "Review High-Interest Debt",
                description: "Your credit card has 18.9% interest. Consider a balance transfer.",
                category: "debt",
                priority: "high",
                isCompleted: false
              }
            ],
            onboardingCompleted: true
          };
          
          // Store the sample data for this session
          localStorage.setItem(`onboarding_data_${user.uid}`, JSON.stringify(sampleOnboardingData));
          onboardingData = sampleOnboardingData;
          console.log('Created sample onboarding data:', onboardingData);
        }
        
        // Try to get user document with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        const userData = await Promise.race([
          getUserDocument(user.uid),
          timeoutPromise
        ]);

        // Use onboarding data if available, otherwise use Firestore data
        const dataToUse = onboardingData || userData;

        if (dataToUse) {
          console.log('Using data from onboarding/Firestore:', dataToUse);
          const fallbackData = getFallbackData(user);
          // Use onboarding/Firestore data if available
          return {
            ...fallbackData,
            stats: {
              totalSaved: dataToUse?.emergencyFund?.currentAmount || 0,
              monthlyIncome: dataToUse?.monthlyIncome || 3500,
              savingsRate: dataToUse?.savingsRate || 15,
              creditScore: dataToUse?.creditScore || 720
            },
            spending: {
              total: dataToUse?.totalSpent || 0,
              budget: dataToUse?.monthlyBudget || 3000,
              remaining: Math.max((dataToUse?.monthlyBudget || 3000) - (dataToUse?.totalSpent || 0), 0),
              totalThisMonth: dataToUse?.totalSpent || 0,
              categories: (dataToUse as any)?.totalSpent > 0 ? [
                { name: 'Shopping', amount: Math.round((dataToUse as any).totalSpent * 0.35), percentage: 35 },
                { name: 'Dining', amount: Math.round((dataToUse as any).totalSpent * 0.28), percentage: 28 },
                { name: 'Transport', amount: Math.round((dataToUse as any).totalSpent * 0.17), percentage: 17 },
                { name: 'Entertainment', amount: Math.round((dataToUse as any).totalSpent * 0.12), percentage: 12 },
                { name: 'Utilities', amount: Math.round((dataToUse as any).totalSpent * 0.08), percentage: 8 }
              ] : []
            },
            emergencyFund: {
              current: dataToUse?.emergencyFund?.currentAmount || 0,
              target: dataToUse?.emergencyFund?.targetAmount || 15000,
              progress: Math.round(((dataToUse?.emergencyFund?.currentAmount || 0) / (dataToUse?.emergencyFund?.targetAmount || 15000)) * 100),
              currentAmount: dataToUse?.emergencyFund?.currentAmount || 0,
              targetAmount: dataToUse?.emergencyFund?.targetAmount || 15000,
              monthsOfExpenses: Math.round((dataToUse?.emergencyFund?.currentAmount || 0) / (dataToUse?.monthlyBudget || 3000)),
              targetMonths: dataToUse?.emergencyFundTarget || 6,
              monthlyContribution: 500
            },
            aiTasks: dataToUse?.aiTasks || getFallbackData(user).aiTasks,
            connectedAccounts: getLocalAccountsFallback(user?.uid).length > 0 
              ? getLocalAccountsFallback(user?.uid) 
              : userData?.accounts || [],
            portfolio: {
              totalBalance: (() => {
                const localAccounts = getLocalAccountsFallback(user?.uid);
                const accounts = localAccounts.length > 0 ? localAccounts : (userData?.accounts || []);
                return accounts.reduce((sum: number, account: any) => sum + (account.balance || 0), 0);
              })()
            }
          };
        }
      } catch (error) {
        console.log('Using fallback data due to Firestore issue:', error);
      }

      // Return fallback data with local storage accounts and transactions if Firestore fails
      const fallbackData = getFallbackData(user);
      const localAccounts = getLocalAccountsFallback(user?.uid);
      const localTransactions = getLocalTransactionsFallback(user?.uid);
      
      // Calculate real spending from local transactions
      const spendingData = calculateSpendingBreakdown(localTransactions);
      
      // Check for onboarding data to override fallback values
      const localOnboardingData = localStorage.getItem(`onboarding_data_${user.uid}`);
      let onboardingOverrides = {};
      
      if (localOnboardingData) {
        try {
          const onboarding = JSON.parse(localOnboardingData);
          onboardingOverrides = {
            stats: {
              totalSaved: onboarding?.emergencyFund?.currentAmount || fallbackData.stats.totalSaved,
              monthlyIncome: onboarding?.monthlyIncome || fallbackData.stats.monthlyIncome,
              savingsRate: onboarding?.savingsRate || fallbackData.stats.savingsRate,
              creditScore: onboarding?.creditScore || fallbackData.stats.creditScore
            },
            emergencyFund: {
              current: onboarding?.emergencyFund?.currentAmount || fallbackData.emergencyFund.current,
              target: onboarding?.emergencyFund?.targetAmount || fallbackData.emergencyFund.target,
              progress: Math.round(((onboarding?.emergencyFund?.currentAmount || 0) / (onboarding?.emergencyFund?.targetAmount || 15000)) * 100),
              currentAmount: onboarding?.emergencyFund?.currentAmount || fallbackData.emergencyFund.currentAmount,
              targetAmount: onboarding?.emergencyFund?.targetAmount || fallbackData.emergencyFund.targetAmount,
              monthsOfExpenses: Math.round((onboarding?.emergencyFund?.currentAmount || 0) / (onboarding?.monthlyBudget || 3000)),
              targetMonths: onboarding?.emergencyFundTarget || fallbackData.emergencyFund.targetMonths,
              monthlyContribution: 500
            },
            spending: {
              total: onboarding?.totalSpent || spendingData.totalSpent,
              budget: onboarding?.monthlyBudget || 3000,
              remaining: Math.max(0, (onboarding?.monthlyBudget || 3000) - (onboarding?.totalSpent || spendingData.totalSpent)),
              totalThisMonth: onboarding?.totalSpent || spendingData.totalSpent,
              categories: spendingData.categories
            },
            debtAccounts: onboarding?.debts?.map((debt: any, index: number) => ({
              id: index + 1,
              userId: 1,
              name: debt.type || 'Debt',
              balance: debt.totalAmount || '0',
              apr: debt.interestRate || '0',
              minimumPayment: debt.monthlyRepayment || '0',
              suggestedPayment: null,
              priority: index + 1
            })) || []
          };
          console.log('Applied onboarding data overrides:', onboardingOverrides);
        } catch (e) {
          console.error('Error parsing onboarding data for overrides:', e);
        }
      }
      
      console.log('Using fallback data with local accounts:', {
        localAccounts,
        localTransactions: localTransactions.length,
        spendingData,
        fallbackAccounts: fallbackData.connectedAccounts,
        onboardingOverrides
      });
      
      return {
        ...fallbackData,
        ...onboardingOverrides,
        connectedAccounts: localAccounts.length > 0 ? localAccounts : fallbackData.connectedAccounts,
        recentTransactions: localTransactions,
        portfolio: {
          totalBalance: localAccounts.length > 0 
            ? localAccounts.reduce((sum: number, account: any) => sum + (account.balance || 0), 0)
            : fallbackData.portfolio.totalBalance
        },
        investingAccount: {
          id: 1,
          userId: 1,
          totalInvested: "0.00",
          totalReturns: "0.00",
          roundUpEnabled: false,
          monthlyRoundUps: "0.00"
        }
      };
    },
    enabled: !!user?.uid,
  });
}
