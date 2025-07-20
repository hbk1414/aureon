export const dummyUser = {
  uid: "user_123",
  email: "alex.johnson@example.com",
  displayName: "Alex Johnson",
  firstName: "Alex",
  initials: "AJ",
};

export const dummyAccounts = [
  { id: 1, name: "Monzo", type: "current", balance: 3200.50 },
  { id: 2, name: "HSBC", type: "savings", balance: 15000.00 },
  { id: 3, name: "Barclays", type: "credit", balance: -1200.00 },
];

function getCurrentMonthDate(day: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // JS months are 0-based, so month is correct
  // Clamp day to valid range for the month
  const lastDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return new Date(year, month, safeDay).toISOString().slice(0, 10);
}

export const dummyTransactions = [
  { id: 1, date: getCurrentMonthDate(1), amount: 2500, category: "salary", merchant: "Acme Corp", description: "Monthly Salary" },
  { id: 2, date: getCurrentMonthDate(2), amount: -120, category: "groceries", merchant: "Tesco", description: "Groceries" },
  { id: 3, date: getCurrentMonthDate(3), amount: -60, category: "transport", merchant: "TfL", description: "Travelcard" },
  { id: 4, date: getCurrentMonthDate(4), amount: -45, category: "dining", merchant: "Nando's", description: "Dinner" },
  { id: 5, date: getCurrentMonthDate(5), amount: -200, category: "shopping", merchant: "Amazon", description: "Electronics" },
  { id: 6, date: getCurrentMonthDate(6), amount: 100, category: "income", merchant: "Freelance", description: "Side Project" },
  { id: 7, date: getCurrentMonthDate(7), amount: -80, category: "bills", merchant: "British Gas", description: "Gas Bill" },
  { id: 8, date: getCurrentMonthDate(8), amount: -30, category: "subscriptions", merchant: "Netflix", description: "Subscription" },
  { id: 9, date: getCurrentMonthDate(9), amount: -50, category: "groceries", merchant: "Sainsbury's", description: "Groceries" },
  { id: 10, date: getCurrentMonthDate(10), amount: -25, category: "dining", merchant: "Costa Coffee", description: "Coffee" },
];

export const dummyGoals = [
  { id: 1, name: "Holiday Fund", target: 2000, current: 800, due: "2024-12-01" },
  { id: 2, name: "Emergency Fund", target: 6000, current: 4200, due: "2025-06-01" },
];

export const dummyStats = {
  totalSaved: 5000,
  monthlyIncome: 2600,
  savingsRate: 18,
  creditScore: 735,
};

export const dummyAITasks = [
  { id: 1, title: "Review subscriptions", description: "You have 3 active subscriptions. Consider cancelling unused ones.", completed: false, priority: "medium", category: "budgeting" },
  { id: 2, title: "Increase savings rate", description: "Try to save 20% of your income this month.", completed: false, priority: "high", category: "savings" },
];

export const dummyEmergencyFund = {
  currentAmount: 4200,
  targetAmount: 6000,
  monthsOfExpenses: 4,
  targetMonths: 6,
  monthlyContribution: 300,
};

export const dummyDebts = [
  { id: 1, name: "Barclays Credit Card", balance: 1200, apr: 18.9, minimumPayment: 50 },
];

export const dummyCouple = {
  coupleId: "couple_456",
  partner: { name: "Jamie Lee", email: "jamie.lee@example.com" },
  sharedGoals: [
    { id: 1, name: "Wedding", target: 10000, current: 3500, due: "2025-09-01" },
    { id: 2, name: "Home Deposit", target: 40000, current: 12000, due: "2026-06-01" },
  ],
};

export const dummyPortfolio = {
  totalBalance: 20000,
};

export const dummyBudgets = [
  { category: "Housing", amount: 800 },
  { category: "Transport", amount: 200 },
  { category: "Groceries", amount: 300 },
  { category: "Leisure", amount: 100 },
];

export const dummyRecurringPayments = [
  { id: 1, name: "Netflix", amount: 10.99, frequency: "monthly", nextDate: "2024-08-01" },
  { id: 2, name: "Spotify", amount: 9.99, frequency: "monthly", nextDate: "2024-08-05" },
];

export const dummySpareChangeInvestments = {
  totalInvested: 47.20,
  roundUps: [
    { id: 1, sourceTransaction: 2, roundUpAmount: 0.50 },
    { id: 2, sourceTransaction: 5, roundUpAmount: 0.80 },
  ],
};

export const dummyNotifications = [
  { id: 1, message: "Your partner Jamie updated your Home Deposit goal", type: "info", date: "2024-07-18" },
  { id: 2, message: "You’ve spent £200 on groceries this week", type: "alert", date: "2024-07-17" },
]; 