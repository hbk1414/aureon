import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Auth from "@/pages/auth";
import Onboarding from "@/pages/onboarding";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { getUserDocument } from "@/lib/firestore";
import { useEffect, useState } from "react";

function ProtectedRoute({ component: Component, requiresOnboarding = true }: { 
  component: React.ComponentType; 
  requiresOnboarding?: boolean;
}) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [userDoc, setUserDoc] = useState<any>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user && requiresOnboarding) {
        try {
          // Check local storage first for onboarding completion
          const localOnboardingComplete = localStorage.getItem(`onboarding_${user.uid}`);
          if (localOnboardingComplete === 'true') {
            console.log('Found local onboarding completion flag');
            setUserDoc({ onboardingCompleted: true });
            setCheckingOnboarding(false);
            return;
          }

          console.log('Checking Firestore for user document');
          const doc = await getUserDocument(user.uid);
          if (doc && doc.onboardingCompleted) {
            console.log('Found completed onboarding in Firestore');
            // Set local storage for faster future checks
            localStorage.setItem(`onboarding_${user.uid}`, 'true');
          }
          setUserDoc(doc);
        } catch (error) {
          console.log("No user document found, needs onboarding");
          setUserDoc(null);
        }
      }
      setCheckingOnboarding(false);
    };

    if (user) {
      checkOnboardingStatus();
    } else {
      setCheckingOnboarding(false);
    }
  }, [user, requiresOnboarding]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If user needs onboarding and hasn't completed it
  if (requiresOnboarding && (!userDoc || !userDoc?.onboardingCompleted)) {
    return <Onboarding />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} requiresOnboarding={false} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
