import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Dashboard Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Welcome Banner Skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-16 w-16 rounded-full" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Skeleton */}
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center space-y-2">
                    <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Connections Skeleton */}
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Spending Overview Skeleton */}
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-36 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full" />
                  <div className="flex justify-between text-sm">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Fund & Micro Investing Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-4">
                    <Skeleton className="h-2 w-full" />
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="flex justify-between">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="lg:col-span-1 space-y-6 order-first lg:order-last">
          {/* AI Tasks Skeleton */}
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Skeleton */}
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-3" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}