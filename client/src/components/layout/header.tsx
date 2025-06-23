import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import aureonLogo from "@assets/ChatGPT Image Jun 23, 2025, 12_13_52 PM_1750677255821.png";

interface HeaderProps {
  user: {
    name: string;
    initials: string;
  };
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center p-4">
              <img 
                src={aureonLogo} 
                alt="AUREON" 
                className="h-20 w-20"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 p-2">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{user.initials}</span>
              </div>
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
