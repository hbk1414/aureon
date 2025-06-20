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
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Good morning, {user.firstName}!
          </h2>
          <p className="text-white/90">
            Your AI agent has prepared new financial tasks for today.
          </p>
        </div>
        <div className="text-right bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="text-3xl font-bold text-white drop-shadow-sm">
            £{portfolio.totalBalance.toLocaleString()}
          </div>
          <div className="text-white/90 text-sm font-medium">Total Portfolio</div>
        </div>
      </div>
    </div>
  );
}
