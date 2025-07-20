import { useEffect, useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import aureonLogo from "@assets/ChatGPT Image Jun 23, 2025, 12_13_52 PM_1750677255821.png";

interface HeaderProps {
  user?: {
    name: string;
    initials: string;
  };
}

export default function Header({ user }: HeaderProps) {
  const { signOut, user: authUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [show, setShow] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const curr = window.scrollY;
          setShow(curr < 10 || curr < lastScroll);
          setLastScroll(curr);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
      setLocation("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const displayName = user?.name || authUser?.displayName || authUser?.email?.split('@')[0] || 'User';
  const initials = user?.initials || displayName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 transition-transform duration-300 ${show ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-36">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center p-4">
              <img 
                src={aureonLogo} 
                alt="AUREON" 
                className="h-32 w-32 contrast-125 saturate-110"
                style={{ height: '135px', width: '135px' }}
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 p-2">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{initials}</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-700">{displayName}</div>
                <div className="text-xs text-gray-500 flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Securely authenticated</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
