import { storage } from "../storage";
import { 
  generateFinancialTasks, 
  optimizeDebtPayoffStrategy, 
  generateSavingsRecommendations,
  type FinancialAnalysisInput,
  type AITaskRecommendation
} from "./openai";
import type { InsertAiTask } from "@shared/schema";

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
