import { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchAccountsWithTransactions } from "@/services/truelayer";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import WelcomeBanner from "@/components/dashboard/welcome-banner";
import AccountConnections from "@/components/dashboard/account-connections";
import SpendingOverview from "@/components/dashboard/spending-overview";
import DebtPayoffStrategy from "@/components/dashboard/debt-payoff-strategy";
import { MicroInvesting } from "@/components/dashboard/micro-investing-firestore";
import AiTasks from "@/components/dashboard/ai-tasks";
import { EmergencyFund } from "@/components/dashboard/emergency-fund-firestore";
import Couples from "@/components/dashboard/couples";
import QuickActions from "@/components/dashboard/quick-actions";
import SmartInsights from "@/components/dashboard/smart-insights";
import DashboardSkeleton from "@/components/dashboard/dashboard-skeleton";
import TrueLayerAccounts from "@/components/dashboard/truelayer-accounts";
import { useAuth } from "@/hooks/use-auth";
import {
  dummyUser,
  dummyAccounts,
  dummyTransactions,
  dummyGoals,
  dummyStats,
  dummyAITasks,
  dummyEmergencyFund,
  dummyDebts,
  dummyCouple,
  dummyPortfolio,
  dummyBudgets,
  dummyRecurringPayments,
  dummySpareChangeInvestments,
  dummyNotifications
} from "@/lib/dummyData";
import BudgetCard from "@/components/dashboard/budget-card";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trueLayerData, setTrueLayerData] = useState<any>(null);
  const [isLoadingTrueLayer, setIsLoadingTrueLayer] = useState(false);

  // Check for TrueLayer token in URL and fetch data
  useEffect(() => {
    const handleTrueLayerToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (token) {
        console.log('🔗 TrueLayer token detected in dashboard URL:', token);
        setIsLoadingTrueLayer(true);
        
        try {
          console.log('📊 Starting TrueLayer data fetch...');
          
          // Fetch all account and transaction data
          const accountsWithTransactions = await fetchAccountsWithTransactions(token);
          
          console.log('✅ TrueLayer data fetched successfully:', accountsWithTransactions);
          setTrueLayerData(accountsWithTransactions);
          
          // Show success notification
          toast({
            title: "Bank Data Loaded!",
            description: `Successfully loaded ${accountsWithTransactions.length} account(s) from TrueLayer`,
          });
          
          // Clean up URL by removing token parameter
          const newUrl = window.location.pathname;
          window.history.replaceState(null, '', newUrl);
          
        } catch (error) {
          console.error('❌ Error fetching TrueLayer data:', error);
          toast({
            title: "Data Fetch Error",
            description: "Failed to load bank data from TrueLayer",
            variant: "destructive",
          });
        } finally {
          setIsLoadingTrueLayer(false);
        }
      }
    };

    handleTrueLayerToken();
  }, [toast]);

  // Use dummy data directly
  const dashboardData = {
    user: { ...dummyUser, name: dummyUser.displayName || dummyUser.firstName || "User" },
    portfolio: dummyPortfolio,
    connectedAccounts: dummyAccounts.map(acc => ({
      ...acc,
      bankName: acc.name,
      last4: "1234"
    })),
    recentTransactions: dummyTransactions,
    financialGoals: dummyGoals,
    stats: dummyStats,
    aiTasks: dummyAITasks,
    emergencyFund: dummyEmergencyFund,
    debtAccounts: dummyDebts.map(d => ({
      ...d,
      userId: 1,
      priority: null,
      balance: String(d.balance),
      apr: String(d.apr),
      minimumPayment: String(d.minimumPayment),
      suggestedPayment: null
    })),
    couple: dummyCouple,
    budgets: dummyBudgets,
    recurringPayments: dummyRecurringPayments,
    spareChangeInvestments: dummySpareChangeInvestments,
    notifications: dummyNotifications,
    spending: {
      total: 1200,
      budget: 2000,
      remaining: 800,
      totalThisMonth: 1200,
      categories: []
    }
  };
  
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={{ name: "No Data", initials: "" }} />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">No dashboard data available</div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Header user={dashboardData.user} />
      
      {/* Welcome Section - Full Width */}
      <motion.section 
        className="bg-gradient-to-br from-white to-gray-50 py-6 mb-6 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* TrueLayer Loading Indicator */}
          {isLoadingTrueLayer && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 font-medium">Loading TrueLayer bank data...</span>
              </div>
            </div>
          )}
          
          {/* TrueLayer Data Display */}
          {trueLayerData && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-green-800 font-medium mb-3">🏦 TrueLayer Bank Data Loaded Successfully</h3>
              <div className="space-y-2">
                {trueLayerData.map((account: any, index: number) => (
                  <div key={account.account_id} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-gray-900">{account.display_name}</span>
                        <span className="text-sm text-gray-500 ml-2">({account.account_type})</span>
                        {account.provider && (
                          <span className="text-sm text-blue-600 ml-2">{account.provider.display_name}</span>
                        )}
                      </div>
                      <div className="text-right">
                        {account.transactions && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {account.transactions.length} transactions
                          </span>
                        )}
                      </div>
                    </div>
                    {account.account_number && (
                      <div className="text-xs text-gray-500 mt-1">
                        {account.account_number.sort_code && `Sort: ${account.account_number.sort_code}`}
                        {account.account_number.number && ` | Account: ${account.account_number.number}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-green-600 mt-3">
                ✅ Check browser console for detailed account and transaction data
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <WelcomeBanner 
                user={dashboardData.user} 
                portfolio={dashboardData.portfolio}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Quick Actions Section - Full Width */}
      <motion.section 
        className="bg-gradient-to-br from-gray-50 to-gray-100 py-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <QuickActions />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Main Dashboard Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="grid grid-cols-12 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {/* Main Content Area - 9 columns on large screens */}
          <motion.div 
            className="col-span-12 lg:col-span-9 space-y-6"
            variants={sectionVariants}
          >
            {/* Budget Card - premium summary and chart */}
            <BudgetCard />
            {/* Financial Management Section */}
            <motion.section 
              className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 py-6 px-6 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300"
              variants={sectionVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Management</h2>
              <div className="space-y-6">
                {/* TrueLayer Connected Accounts */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Connected Bank Accounts</h3>
                  <TrueLayerAccounts />
                </div>
                
                {/* Dummy Account Overview */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Account Overview</h3>
                  <AccountConnections 
                    accounts={dashboardData.connectedAccounts}
                  />
                </div>
                
                <SpendingOverview 
                  spending={dashboardData.spending}
                />
                <DebtPayoffStrategy 
                  debtAccounts={dashboardData.debtAccounts}
                />
              </div>
            </motion.section>

            {/* Savings & Investments Section */}
            <motion.section 
              className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 py-6 px-6 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300"
              variants={sectionVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Savings & Investments</h2>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 xl:col-span-6">
                  <MicroInvesting />
                </div>
                <div className="col-span-12 xl:col-span-6">
                  <EmergencyFund />
                </div>
              </div>
            </motion.section>

          </motion.div>

          {/* Sidebar - 3 columns on large screens */}
          <motion.div 
            className="col-span-12 lg:col-span-3 space-y-6"
            variants={sectionVariants}
          >
            <motion.section 
              className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 py-6 px-6 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300"
              variants={sectionVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">AI Assistant</h2>
              <AiTasks 
                tasks={[]}
              />
            </motion.section>
          </motion.div>

        </motion.div>
      </div>

      {/* Shared Goals Section - Full Width */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <motion.section 
          className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 py-6 px-6 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300"
          variants={sectionVariants}
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shared Goals</h2>
          <Couples />
        </motion.section>
      </div>

      {/* Insights & Analytics Section - Full Width */}
      <motion.section 
        className="bg-gradient-to-br from-gray-50 to-gray-100 py-6 mt-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <SmartInsights />
            </div>
          </div>
        </div>
      </motion.section>

    </motion.div>
  );
}
