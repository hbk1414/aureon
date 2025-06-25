import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { getUserDocument } from "@/lib/firestore";

// Local storage fallback helper
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
    cacheTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async () => {
      if (!user?.uid) throw new Error('User not authenticated');

      try {
        // Try to get user document with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        const userData = await Promise.race([
          getUserDocument(user.uid),
          timeoutPromise
        ]);

        if (userData) {
          // Use Firestore data if available
          return {
            ...getFallbackData(user),
            stats: {
              totalSaved: userData.totalSpent || 0,
              monthlyIncome: 5000,
              savingsRate: userData.savingsRate || 15,
              creditScore: userData.creditScore || 720
            },
            spending: {
              total: userData.totalSpent || 0,
              budget: userData.monthlyBudget || 3000,
              remaining: Math.max((userData.monthlyBudget || 3000) - (userData.totalSpent || 0), 0),
              totalThisMonth: userData.totalSpent || 0,
              categories: userData.totalSpent > 0 ? [
                { name: 'Shopping', amount: Math.round(userData.totalSpent * 0.35), percentage: 35 },
                { name: 'Dining', amount: Math.round(userData.totalSpent * 0.28), percentage: 28 },
                { name: 'Transport', amount: Math.round(userData.totalSpent * 0.17), percentage: 17 },
                { name: 'Entertainment', amount: Math.round(userData.totalSpent * 0.12), percentage: 12 },
                { name: 'Utilities', amount: Math.round(userData.totalSpent * 0.08), percentage: 8 }
              ] : []
            },
            emergencyFund: userData.emergencyFund || {
              currentAmount: 0,
              targetAmount: 15000,
              monthsOfExpenses: 0,
              targetMonths: 6,
              monthlyContribution: 500
            },
            aiTasks: userData.aiTasks || getFallbackData(user).aiTasks,
            connectedAccounts: userData?.accounts || getLocalAccountsFallback(user?.uid),
            portfolio: {
              totalBalance: (userData?.accounts || getLocalAccountsFallback(user?.uid)).reduce((sum: number, account: any) => sum + (account.balance || 0), 0) || 0
            }
          };
        }
      } catch (error) {
        console.log('Using fallback data due to Firestore issue:', error);
      }

      // Return fallback data immediately if Firestore fails or times out
      return getFallbackData(user);
    },
    enabled: !!user?.uid,
  });
}
