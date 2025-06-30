import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import Header from "@/components/layout/header";
import WelcomeBanner from "@/components/dashboard/welcome-banner";
import AccountConnections from "@/components/dashboard/account-connections";
import SpendingOverview from "@/components/dashboard/spending-overview";
import DebtPayoffStrategy from "@/components/dashboard/debt-payoff-strategy";
import { MicroInvesting } from "@/components/dashboard/micro-investing-firestore";
import AiTasks from "@/components/dashboard/ai-tasks";
import EmergencyFund from "@/components/dashboard/emergency-fund";
import Couples from "@/components/dashboard/couples";
import QuickStats from "@/components/dashboard/quick-stats";
import QuickActions from "@/components/dashboard/quick-actions";
import DashboardSkeleton from "@/components/dashboard/dashboard-skeleton";
import { useFinancialData } from "@/hooks/use-financial-data";

export default function Dashboard() {
  const dashboardQuery = useFinancialData();

  if (dashboardQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={{ name: "Loading...", initials: "L" }} />
        <DashboardSkeleton />
      </div>
    );
  }

  if (dashboardQuery.error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={{ name: "Error", initials: "" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-danger">Failed to load dashboard data</div>
        </div>
      </div>
    );
  }

  const dashboardData = dashboardQuery.data;
  
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
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Dashboard Area */}
          <div className="lg:col-span-3 space-y-6">
            <WelcomeBanner 
              user={dashboardData.user} 
              portfolio={dashboardData.portfolio}
            />

            <QuickActions />
            
            <AccountConnections 
              accounts={dashboardData.connectedAccounts}
            />
            
            <SpendingOverview 
              spending={dashboardData.spending}
            />
            
            <DebtPayoffStrategy 
              debtAccounts={dashboardData.debtAccounts}
            />
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <MicroInvesting />

              <EmergencyFund 
                emergencyFund={dashboardData.emergencyFund}
              />
            </div>

            {/* Couples Section */}
            <Couples 
              partner={dashboardData.partner}
              sharedGoals={dashboardData.sharedGoals || []}
              totalSaved={dashboardData.couplesSavings?.totalSaved || 0}
              monthlyContribution={dashboardData.couplesSavings?.monthlyContribution || 0}
            />
          </div>

          {/* Sidebar - Hidden on mobile, shows as bottom section */}
          <div className="lg:col-span-1 space-y-6 order-first lg:order-last">
            <AiTasks 
              tasks={dashboardData.aiTasks}
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
