import { Bot, Sparkles } from "lucide-react";

interface WelcomeBannerProps {
  user: {
    firstName: string;
  };
  portfolio: {
    totalBalance: number;
  };
}

export default function WelcomeBanner({ user, portfolio }: WelcomeBannerProps) {
  return (
    <div className="bg-primary rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-white/10 rounded-lg animate-pulse">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              Good morning, {user.firstName}!
              <Sparkles className="h-5 w-5 ml-2 text-yellow-300 animate-bounce" />
            </h2>
            <p className="text-white/90 mb-1">
              Your AI agent suggests 3 ways to optimise your finances today.
            </p>
            <p className="text-white/70 text-sm">
              Ready to boost your wealth strategy?
            </p>
          </div>
        </div>
        <div className="text-right bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
          <div className="text-3xl font-bold text-white drop-shadow-sm">
            £{portfolio.totalBalance.toLocaleString()}
          </div>
          <div className="text-white/90 text-sm font-medium">Total Portfolio</div>
        </div>
      </div>
    </div>
  );
}
