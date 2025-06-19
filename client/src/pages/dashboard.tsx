import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import WelcomeBanner from "@/components/dashboard/welcome-banner";
import AccountConnections from "@/components/dashboard/account-connections";
import SpendingOverview from "@/components/dashboard/spending-overview";
import DebtPayoffStrategy from "@/components/dashboard/debt-payoff-strategy";
import MicroInvesting from "@/components/dashboard/micro-investing";
import AiTasks from "@/components/dashboard/ai-tasks";
import EmergencyFund from "@/components/dashboard/emergency-fund";
import QuickStats from "@/components/dashboard/quick-stats";
import { useFinancialData } from "@/hooks/use-financial-data";

export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useFinancialData(1); // Using demo user ID

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={{ name: "Loading...", initials: "" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading your financial dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={{ name: "Error", initials: "" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-danger">Failed to load dashboard data</div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={{ name: "No Data", initials: "" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">No dashboard data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={dashboardData.user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Dashboard Area */}
          <div className="lg:col-span-3 space-y-6">
            <WelcomeBanner 
              user={dashboardData.user} 
              portfolio={dashboardData.portfolio}
            />
            
            <AccountConnections 
              accounts={dashboardData.connectedAccounts}
            />
            
            <SpendingOverview 
              spending={dashboardData.spending}
            />
            
            <DebtPayoffStrategy 
              debtAccounts={dashboardData.debtAccounts}
            />
            
            <MicroInvesting 
              investingAccount={dashboardData.investingAccount}
              recentTransactions={dashboardData.recentTransactions}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <AiTasks 
              tasks={dashboardData.aiTasks}
            />
            
            <EmergencyFund 
              emergencyFund={dashboardData.emergencyFund}
            />
            
            <QuickStats 
              stats={dashboardData.stats}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
