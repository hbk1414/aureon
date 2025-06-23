import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { 
  getConnectedAccounts, 
  getTransactions, 
  getFinancialGoals, 
  getAiTasks,
  getDebtAccounts,
  getInvestingAccount 
} from "@/lib/firestore";

export function useFinancialData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['/api/dashboard', user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error('User not authenticated');

      // Fetch data from Firestore
      const [
        connectedAccounts,
        transactions,
        financialGoals,
        aiTasks,
        debtAccounts,
        investingAccount
      ] = await Promise.all([
        getConnectedAccounts(user.uid),
        getTransactions(user.uid, 10),
        getFinancialGoals(user.uid),
        getAiTasks(user.uid, false),
        getDebtAccounts(user.uid),
        getInvestingAccount(user.uid)
      ]);

      // Calculate portfolio balance from connected accounts
      const totalBalance = connectedAccounts.reduce((sum, account) => {
        return sum + parseFloat(account.balance || '0');
      }, 0);

      // Mock spending data for new users
      const spending = {
        total: connectedAccounts.length > 0 ? 2450 : 0,
        budget: connectedAccounts.length > 0 ? 3000 : 0,
        remaining: connectedAccounts.length > 0 ? 550 : 0,
        totalThisMonth: connectedAccounts.length > 0 ? 2450 : 0,
        categories: connectedAccounts.length > 0 ? [
          { name: 'Shopping', amount: 850, percentage: 35 },
          { name: 'Dining', amount: 680, percentage: 28 },
          { name: 'Transport', amount: 420, percentage: 17 },
          { name: 'Entertainment', amount: 300, percentage: 12 },
          { name: 'Utilities', amount: 200, percentage: 8 }
        ] : []
      };

      // Mock emergency fund data for new users
      const emergencyFund = {
        currentAmount: connectedAccounts.length > 0 ? 5200 : 0,
        targetAmount: 15000,
        monthsOfExpenses: connectedAccounts.length > 0 ? 2.1 : 0,
        targetMonths: 6,
        monthlyContribution: connectedAccounts.length > 0 ? 500 : 0
      };

      return {
        user: {
          name: user.displayName || user.email?.split('@')[0] || 'User',
          firstName: user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User',
          initials: (user.displayName || user.email?.split('@')[0] || 'User').split(' ').map(n => n[0]).join('').toUpperCase()
        },
        portfolio: {
          totalBalance
        },
        connectedAccounts,
        recentTransactions: transactions,
        financialGoals,
        aiTasks,
        debtAccounts,
        investingAccount,
        spending,
        emergencyFund,
        stats: {
          totalSaved: totalBalance,
          monthlyIncome: 5000,
          savingsRate: 0.25,
          creditScore: 750
        },
        // Mock couples data
        partner: null,
        sharedGoals: [],
        couplesSavings: {
          totalSaved: 0,
          monthlyContribution: 0
        }
      };
    },
    enabled: !!user?.uid,
  });
}
