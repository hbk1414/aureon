import { storage } from "../storage";
import { 
  generateFinancialTasks, 
  optimizeDebtPayoffStrategy, 
  generateSavingsRecommendations,
  type FinancialAnalysisInput,
  type AITaskRecommendation
} from "./openai";
import type { InsertAiTask } from "@shared/schema";

// --- SMART INSIGHTS LOGIC ---

// Mock transaction data (replace with Firestore or real DB in production)
const mockTransactions = [
  { id: 1, userId: 1, category: 'Takeout', amount: 120, date: '2024-07-01', merchant: 'Uber Eats', type: 'expense' },
  { id: 2, userId: 1, category: 'Takeout', amount: 80, date: '2024-07-10', merchant: 'Deliveroo', type: 'expense' },
  { id: 3, userId: 1, category: 'Takeout', amount: 60, date: '2024-07-15', merchant: 'Just Eat', type: 'expense' },
  { id: 4, userId: 1, category: 'Entertainment', amount: 200, date: '2024-07-05', merchant: 'Netflix', type: 'expense' },
  { id: 5, userId: 1, category: 'Entertainment', amount: 50, date: '2024-07-12', merchant: 'Spotify', type: 'expense' },
  { id: 6, userId: 1, category: 'Groceries', amount: 300, date: '2024-07-03', merchant: 'Tesco', type: 'expense' },
  { id: 7, userId: 1, category: 'Baby', amount: 150, date: '2024-07-08', merchant: 'Mothercare', type: 'expense' },
  { id: 8, userId: 1, category: 'Subscriptions', amount: 10, date: '2024-05-01', merchant: 'Disney+', type: 'subscription', lastUsed: '2024-04-01' },
  { id: 9, userId: 1, category: 'Subscriptions', amount: 10, date: '2024-06-01', merchant: 'Disney+', type: 'subscription', lastUsed: '2024-04-01' },
  { id: 10, userId: 1, category: 'Savings', amount: -100, date: '2024-07-01', merchant: 'Bank', type: 'transfer' },
  { id: 11, userId: 1, category: 'Savings', amount: -100, date: '2024-07-08', merchant: 'Bank', type: 'transfer' },
  { id: 12, userId: 1, category: 'Savings', amount: -100, date: '2024-07-15', merchant: 'Bank', type: 'transfer' },
  // ...add more for richer logic
];

// --- Insight 1: Upcoming Risk Alert ---
function getUpcomingRiskAlert(transactions = mockTransactions) {
  // Projected spend for this month in Takeout
  const now = new Date('2024-07-16'); // mock 'today'
  const thisMonth = now.getMonth();
  const lastMonth = (thisMonth + 11) % 12;
  const thisYear = now.getFullYear();
  // Get this and last month takeout
  const takeoutThisMonth = transactions.filter(t => t.category === 'Takeout' && new Date(t.date).getMonth() === thisMonth && new Date(t.date).getFullYear() === thisYear);
  const takeoutLastMonth = transactions.filter(t => t.category === 'Takeout' && new Date(t.date).getMonth() === lastMonth && new Date(t.date).getFullYear() === thisYear);
  const spentSoFar = takeoutThisMonth.reduce((sum, t) => sum + t.amount, 0);
  const daysSoFar = now.getDate();
  const daysInMonth = 31;
  const projected = Math.round((spentSoFar / daysSoFar) * daysInMonth);
  const lastMonthTotal = takeoutLastMonth.reduce((sum, t) => sum + t.amount, 0);
  if (lastMonthTotal > 0 && projected > lastMonthTotal * 1.2) {
    return {
      message: `⚠️ You’re on track to spend £${projected - lastMonthTotal} more on Takeout this month if your current trend continues.`,
      severity: 'high',
    };
  }
  return null;
}

// --- Insight 2: Goal-Blocking Expense ---
function getGoalBlockingExpense(transactions = mockTransactions) {
  // Find large discretionary spend (e.g. Entertainment)
  const entertainment = transactions.filter(t => t.category === 'Entertainment' && t.amount > 100);
  if (entertainment.length > 0) {
    const biggest = entertainment.reduce((a, b) => (a.amount > b.amount ? a : b));
    return {
      message: `Cutting £${biggest.amount} from Entertainment would help you reach your savings goal earlier.`,
      severity: 'medium',
    };
  }
  return null;
}

// --- Insight 3: Recurring Waste ---
function getRecurringWaste(transactions = mockTransactions) {
  // Find subscriptions not used in 2+ months
  const now = new Date('2024-07-16');
  const waste = transactions.filter(t => t.type === 'subscription' && t.lastUsed && (now.getTime() - new Date(t.lastUsed).getTime()) / (1000 * 60 * 60 * 24) > 60);
  if (waste.length > 0) {
    return {
      message: `You’ve not used ${waste[0].merchant} in over 2 months — worth keeping?`,
      severity: 'medium',
    };
  }
  return null;
}

// --- Insight 4: Streak Win ---
function getStreakWin(transactions = mockTransactions) {
  // Track 3+ consecutive weeks of saving (negative 'Savings' transactions)
  const savings = transactions.filter(t => t.category === 'Savings' && t.amount < 0);
  // Assume one per week for simplicity
  if (savings.length >= 3) {
    return {
      message: `🔥 You’ve saved for ${savings.length} weeks in a row. Keep the streak alive!`,
      severity: 'low',
    };
  }
  return null;
}

// --- Insight 5: Life Event Radar ---
function getLifeEventRadar(transactions = mockTransactions) {
  // Detect baby-related spend
  const baby = transactions.filter(t => t.category === 'Baby');
  if (baby.length > 0) {
    return {
      message: `We noticed increased baby store purchases — want to set a new goal?`,
      severity: 'medium',
    };
  }
  return null;
}

export {
  getUpcomingRiskAlert,
  getGoalBlockingExpense,
  getRecurringWaste,
  getStreakWin,
  getLifeEventRadar,
  mockTransactions,
};

export class FinancialAIService {
  async generateDailyTasks(userId: number): Promise<void> {
    try {
      const financialData = await this.gatherUserFinancialData(userId);
      const aiRecommendations = await generateFinancialTasks(financialData);
      
      // Filter for daily tasks and create them
      const dailyTasks = aiRecommendations.filter(task => task.taskType === 'daily');
      
      for (const taskRec of dailyTasks) {
        const task: InsertAiTask = {
          userId,
          title: taskRec.title,
          description: taskRec.description,
          taskType: taskRec.taskType,
          category: taskRec.category,
          priority: taskRec.priority,
          isCompleted: false,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
          metadata: {
            estimatedImpact: taskRec.estimatedImpact,
            actionItems: taskRec.actionItems,
            generatedAt: new Date().toISOString(),
          },
        };
        
        await storage.createAiTask(task);
      }
    } catch (error) {
      console.error("Error generating daily tasks:", error);
      throw error;
    }
  }

  async generateWeeklyTasks(userId: number): Promise<void> {
    try {
      const financialData = await this.gatherUserFinancialData(userId);
      const aiRecommendations = await generateFinancialTasks(financialData);
      
      // Filter for weekly tasks and create them
      const weeklyTasks = aiRecommendations.filter(task => task.taskType === 'weekly');
      
      for (const taskRec of weeklyTasks) {
        const task: InsertAiTask = {
          userId,
          title: taskRec.title,
          description: taskRec.description,
          taskType: taskRec.taskType,
          category: taskRec.category,
          priority: taskRec.priority,
          isCompleted: false,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due next week
          metadata: {
            estimatedImpact: taskRec.estimatedImpact,
            actionItems: taskRec.actionItems,
            generatedAt: new Date().toISOString(),
          },
        };
        
        await storage.createAiTask(task);
      }
    } catch (error) {
      console.error("Error generating weekly tasks:", error);
      throw error;
    }
  }

  async generateMonthlyTasks(userId: number): Promise<void> {
    try {
      const financialData = await this.gatherUserFinancialData(userId);
      const aiRecommendations = await generateFinancialTasks(financialData);
      
      // Filter for monthly tasks and create them
      const monthlyTasks = aiRecommendations.filter(task => task.taskType === 'monthly');
      
      for (const taskRec of monthlyTasks) {
        const task: InsertAiTask = {
          userId,
          title: taskRec.title,
          description: taskRec.description,
          taskType: taskRec.taskType,
          category: taskRec.category,
          priority: taskRec.priority,
          isCompleted: false,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due next month
          metadata: {
            estimatedImpact: taskRec.estimatedImpact,
            actionItems: taskRec.actionItems,
            generatedAt: new Date().toISOString(),
          },
        };
        
        await storage.createAiTask(task);
      }
    } catch (error) {
      console.error("Error generating monthly tasks:", error);
      throw error;
    }
  }

  async optimizeDebtStrategy(userId: number): Promise<void> {
    try {
      const debts = await storage.getUserDebtAccounts(userId);
      const preferences = await storage.getUserPreferences(userId);
      
      if (debts.length === 0) return;
      
      const availableExtraPayment = preferences?.monthlyBudget 
        ? parseFloat(preferences.monthlyBudget) * 0.1 // Assume 10% of budget available for extra debt payment
        : 200; // Default extra payment
        
      const debtData = debts.map(debt => ({
        name: debt.name,
        balance: parseFloat(debt.balance),
        apr: parseFloat(debt.apr),
        minimumPayment: parseFloat(debt.minimumPayment),
      }));
      
      const strategy = await optimizeDebtPayoffStrategy(debtData, availableExtraPayment);
      
      // Update debt accounts with AI recommendations
      for (const paymentPlan of strategy.monthlyPaymentPlan) {
        const debt = debts.find(d => d.name === paymentPlan.debtName);
        if (debt) {
          await storage.updateDebtAccount(debt.id, {
            suggestedPayment: paymentPlan.suggestedPayment.toString(),
          });
        }
      }
      
      // Update priorities based on AI recommendation
      for (const priorityRec of strategy.priorityOrder) {
        const debt = debts.find(d => d.name === priorityRec.debtName);
        if (debt) {
          await storage.updateDebtAccount(debt.id, {
            priority: priorityRec.priority,
          });
        }
      }
      
      // Create a task about the debt optimization
      const optimizationTask: InsertAiTask = {
        userId,
        title: "Apply AI-Optimized Debt Strategy",
        description: `Your AI agent has optimized your debt payoff strategy using the ${strategy.method} method. This will save you $${strategy.totalInterestSaved} in interest and help you become debt-free ${strategy.timeToDebtFree} months sooner.`,
        taskType: "weekly",
        category: "debt",
        priority: "high",
        isCompleted: false,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        metadata: {
          strategy: strategy,
          generatedAt: new Date().toISOString(),
        },
      };
      
      await storage.createAiTask(optimizationTask);
    } catch (error) {
      console.error("Error optimizing debt strategy:", error);
      throw error;
    }
  }

  async generateSavingsStrategy(userId: number): Promise<void> {
    try {
      const preferences = await storage.getUserPreferences(userId);
      const accounts = await storage.getConnectedAccounts(userId);
      const goals = await storage.getUserFinancialGoals(userId);
      
      if (!preferences) return;
      
      const monthlyIncome = parseFloat(preferences.monthlyBudget || "0") * 1.2; // Estimate income from budget
      const monthlyExpenses = parseFloat(preferences.monthlyBudget || "0");
      const currentSavings = accounts.reduce((sum, acc) => {
        const balance = parseFloat(acc.balance);
        return sum + (balance > 0 ? balance : 0);
      }, 0);
      
      const savingsInput = {
        monthlyIncome,
        monthlyExpenses,
        currentSavings,
        savingsGoals: goals.map(goal => ({
          name: goal.type,
          target: parseFloat(goal.targetAmount),
          deadline: goal.deadline?.toISOString(),
        })),
        riskTolerance: preferences.riskTolerance as 'conservative' | 'moderate' | 'aggressive',
      };
      
      const recommendations = await generateSavingsRecommendations(savingsInput);
      
      // Create tasks based on recommendations
      const emergencyFundTask: InsertAiTask = {
        userId,
        title: "Optimize Emergency Fund Strategy",
        description: `AI recommends saving $${recommendations.emergencyFundRecommendation.monthlySavings}/month to reach your emergency fund target of $${recommendations.emergencyFundRecommendation.targetAmount} in ${recommendations.emergencyFundRecommendation.timeToGoal} months.`,
        taskType: "monthly",
        category: "savings",
        priority: "high",
        isCompleted: false,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: {
          recommendations: recommendations,
          generatedAt: new Date().toISOString(),
        },
      };
      
      await storage.createAiTask(emergencyFundTask);
      
      // Create automation task
      if (recommendations.automationSuggestions.length > 0) {
        const automationTask: InsertAiTask = {
          userId,
          title: "Set Up Automated Savings",
          description: `Implement these AI-recommended automation strategies: ${recommendations.automationSuggestions.slice(0, 3).join(", ")}`,
          taskType: "weekly",
          category: "savings",
          priority: "medium",
          isCompleted: false,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          metadata: {
            automationSuggestions: recommendations.automationSuggestions,
            generatedAt: new Date().toISOString(),
          },
        };
        
        await storage.createAiTask(automationTask);
      }
    } catch (error) {
      console.error("Error generating savings strategy:", error);
      throw error;
    }
  }

  private async gatherUserFinancialData(userId: number): Promise<FinancialAnalysisInput> {
    const [accounts, transactions, preferences, debts, goals] = await Promise.all([
      storage.getConnectedAccounts(userId),
      storage.getUserTransactions(userId, 30),
      storage.getUserPreferences(userId),
      storage.getUserDebtAccounts(userId),
      storage.getUserFinancialGoals(userId),
    ]);
    
    const totalDebt = debts.reduce((sum, debt) => sum + parseFloat(debt.balance), 0);
    const totalSavings = accounts.reduce((sum, acc) => {
      const balance = parseFloat(acc.balance);
      return sum + (balance > 0 ? balance : 0);
    }, 0);
    
    return {
      userProfile: {
        income: parseFloat(preferences?.monthlyBudget || "0") * 1.2, // Estimate income
        expenses: parseFloat(preferences?.monthlyBudget || "0"),
        debt: totalDebt,
        savings: totalSavings,
        goals: goals.map(g => g.type),
      },
      transactions: transactions.map(t => ({
        amount: parseFloat(t.amount),
        category: t.category,
        merchant: t.merchant,
        date: t.date.toISOString(),
      })),
      accounts: accounts.map(a => ({
        type: a.accountType,
        balance: parseFloat(a.balance),
      })),
    };
  }
}

export const financialAI = new FinancialAIService();
