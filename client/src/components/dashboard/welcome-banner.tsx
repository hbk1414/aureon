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
    <div className="bg-gradient-to-r from-primary to-primary-light rounded-xl p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Good morning, {user.firstName}!
          </h2>
          <p className="text-blue-100">
            Your AI agent has prepared new financial tasks for today.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">
            ${portfolio.totalBalance.toLocaleString()}
          </div>
          <div className="text-blue-100 text-sm">Total Portfolio</div>
        </div>
      </div>
    </div>
  );
}
