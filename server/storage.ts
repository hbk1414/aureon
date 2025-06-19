import {
  users, connectedAccounts, transactions, financialGoals, aiTasks, debtAccounts, investingAccounts, userPreferences,
  type User, type InsertUser, type ConnectedAccount, type InsertConnectedAccount,
  type Transaction, type InsertTransaction, type FinancialGoal, type InsertFinancialGoal,
  type AiTask, type InsertAiTask, type DebtAccount, type InsertDebtAccount,
  type InvestingAccount, type InsertInvestingAccount, type UserPreferences, type InsertUserPreferences
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Account operations
  getConnectedAccounts(userId: number): Promise<ConnectedAccount[]>;
  createConnectedAccount(account: InsertConnectedAccount): Promise<ConnectedAccount>;
  updateAccountBalance(accountId: number, balance: string): Promise<void>;

  // Transaction operations
  getTransactions(accountId: number, limit?: number): Promise<Transaction[]>;
  getUserTransactions(userId: number, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Financial goals operations
  getUserFinancialGoals(userId: number): Promise<FinancialGoal[]>;
  createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal>;
  updateFinancialGoal(goalId: number, updates: Partial<FinancialGoal>): Promise<void>;

  // AI tasks operations
  getUserAiTasks(userId: number, completed?: boolean): Promise<AiTask[]>;
  createAiTask(task: InsertAiTask): Promise<AiTask>;
  completeAiTask(taskId: number): Promise<void>;

  // Debt operations
  getUserDebtAccounts(userId: number): Promise<DebtAccount[]>;
  createDebtAccount(debt: InsertDebtAccount): Promise<DebtAccount>;
  updateDebtAccount(debtId: number, updates: Partial<DebtAccount>): Promise<void>;

  // Investing operations
  getUserInvestingAccount(userId: number): Promise<InvestingAccount | undefined>;
  createInvestingAccount(investing: InsertInvestingAccount): Promise<InvestingAccount>;
  updateInvestingAccount(accountId: number, updates: Partial<InvestingAccount>): Promise<void>;

  // User preferences operations
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<void>;
}

export class MemStorage implements IStorage {
  private users = new Map<number, User>();
  private connectedAccounts = new Map<number, ConnectedAccount>();
  private transactions = new Map<number, Transaction>();
  private financialGoals = new Map<number, FinancialGoal>();
  private aiTasks = new Map<number, AiTask>();
  private debtAccounts = new Map<number, DebtAccount>();
  private investingAccounts = new Map<number, InvestingAccount>();
  private userPreferences = new Map<number, UserPreferences>();

  private currentUserId = 1;
  private currentAccountId = 1;
  private currentTransactionId = 1;
  private currentGoalId = 1;
  private currentTaskId = 1;
  private currentDebtId = 1;
  private currentInvestingId = 1;
  private currentPreferencesId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create demo user
    const demoUser: User = {
      id: 1,
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      createdAt: new Date(),
    };
    this.users.set(1, demoUser);

    // Create demo connected accounts
    const chaseAccount: ConnectedAccount = {
      id: 1,
      userId: 1,
      bankName: "Barclays Bank",
      accountType: "Current Account ••••4521",
      accountNumber: "****4521",
      balance: "6750.00",
      isConnected: true,
      lastSync: new Date(),
    };

    const creditCard: ConnectedAccount = {
      id: 2,
      userId: 1,
      bankName: "Nationwide",
      accountType: "Credit Card ••••8901",
      accountNumber: "****8901",
      balance: "-1725.00",
      isConnected: true,
      lastSync: new Date(),
    };

    this.connectedAccounts.set(1, chaseAccount);
    this.connectedAccounts.set(2, creditCard);
    this.currentAccountId = 3;

    // Create demo transactions
    const demoTransactions: Transaction[] = [
      {
        id: 1,
        accountId: 1,
        amount: "-3.65",
        category: "Food & Dining",
        merchant: "Costa Coffee",
        description: "Coffee purchase",
        date: new Date(),
        roundUp: "0.35",
      },
      {
        id: 2,
        accountId: 1,
        amount: "-48.20",
        category: "Petrol & Transport",
        merchant: "BP Petrol Station",
        description: "Petrol fill-up",
        date: new Date(Date.now() - 86400000),
        roundUp: "1.80",
      },
      {
        id: 3,
        accountId: 1,
        amount: "-56.45",
        category: "Groceries",
        merchant: "Tesco",
        description: "Weekly shopping",
        date: new Date(Date.now() - 172800000),
        roundUp: "3.55",
      },
    ];

    demoTransactions.forEach(t => this.transactions.set(t.id, t));
    this.currentTransactionId = 4;

    // Create demo debt accounts
    const demoDebts: DebtAccount[] = [
      {
        id: 1,
        userId: 1,
        name: "Nationwide Credit Card",
        balance: "1725.00",
        apr: "23.90",
        minimumPayment: "52.00",
        suggestedPayment: "310.00",
        priority: 1,
      },
      {
        id: 2,
        userId: 1,
        name: "Student Finance Loan",
        balance: "7156.00",
        apr: "5.50",
        minimumPayment: "125.00",
        suggestedPayment: "125.00",
        priority: 2,
      },
    ];

    demoDebts.forEach(d => this.debtAccounts.set(d.id, d));
    this.currentDebtId = 3;

    // Create demo investing account
    const demoInvesting: InvestingAccount = {
      id: 1,
      userId: 1,
      totalInvested: "310.45",
      totalReturns: "18.52",
      roundUpEnabled: true,
      monthlyRoundUps: "37.85",
    };
    this.investingAccounts.set(1, demoInvesting);

    // Create demo financial goals
    const emergencyFund: FinancialGoal = {
      id: 1,
      userId: 1,
      type: "emergency_fund",
      targetAmount: "8160.00",
      currentAmount: "5400.00",
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
      isCompleted: false,
    };
    this.financialGoals.set(1, emergencyFund);

    // Create demo user preferences
    const preferences: UserPreferences = {
      id: 1,
      userId: 1,
      monthlyBudget: "3200.00",
      emergencyFundMonths: 3,
      riskTolerance: "moderate",
      notificationsEnabled: true,
    };
    this.userPreferences.set(1, preferences);

    // Create demo AI tasks
    const demoTasks: AiTask[] = [
      {
        id: 1,
        userId: 1,
        title: "Review High-Interest Credit Card Payments",
        description: "Your Nationwide card has a 23.9% APR. Consider paying an extra £120 this month to reduce interest charges by £30.",
        taskType: "weekly",
        category: "debt",
        priority: "high",
        isCompleted: false,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        metadata: {
          estimatedImpact: "Save £30 in interest charges",
          actionItems: ["Log into Nationwide account", "Set up extra payment", "Schedule automatic payments"],
          generatedAt: new Date().toISOString(),
        },
      },
      {
        id: 2,
        userId: 1,
        title: "Optimise Emergency Fund Savings",
        description: "Increase your emergency fund by £160 this month. You're 66% to your goal - brilliant progress!",
        taskType: "monthly",
        category: "savings",
        priority: "medium",
        isCompleted: false,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: {
          estimatedImpact: "Build 3-month emergency buffer",
          actionItems: ["Transfer £160 to savings", "Set up automatic monthly transfer", "Review emergency fund goal"],
          generatedAt: new Date().toISOString(),
        },
      },
      {
        id: 3,
        userId: 1,
        title: "Track Daily Coffee Spending",
        description: "You've spent £10.90 on coffee this week. Consider brewing at home 2 days to save £96/month.",
        taskType: "daily",
        category: "budgeting",
        priority: "low",
        isCompleted: false,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: {
          estimatedImpact: "Save £96/month on coffee expenses",
          actionItems: ["Buy coffee beans and brewing supplies", "Prep coffee at home 2x/week", "Track coffee spending"],
          generatedAt: new Date().toISOString(),
        },
      },
    ];

    demoTasks.forEach(task => this.aiTasks.set(task.id, task));
    this.currentTaskId = 4;

    this.currentUserId = 2;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getConnectedAccounts(userId: number): Promise<ConnectedAccount[]> {
    return Array.from(this.connectedAccounts.values()).filter(account => account.userId === userId);
  }

  async createConnectedAccount(account: InsertConnectedAccount): Promise<ConnectedAccount> {
    const id = this.currentAccountId++;
    const newAccount: ConnectedAccount = {
      ...account,
      id,
      lastSync: new Date(),
    };
    this.connectedAccounts.set(id, newAccount);
    return newAccount;
  }

  async updateAccountBalance(accountId: number, balance: string): Promise<void> {
    const account = this.connectedAccounts.get(accountId);
    if (account) {
      account.balance = balance;
      account.lastSync = new Date();
    }
  }

  async getTransactions(accountId: number, limit = 50): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.accountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async getUserTransactions(userId: number, limit = 50): Promise<Transaction[]> {
    const userAccounts = await this.getConnectedAccounts(userId);
    const accountIds = userAccounts.map(a => a.id);
    
    return Array.from(this.transactions.values())
      .filter(t => accountIds.includes(t.accountId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const newTransaction: Transaction = {
      ...transaction,
      id,
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getUserFinancialGoals(userId: number): Promise<FinancialGoal[]> {
    return Array.from(this.financialGoals.values()).filter(goal => goal.userId === userId);
  }

  async createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal> {
    const id = this.currentGoalId++;
    const newGoal: FinancialGoal = {
      ...goal,
      id,
    };
    this.financialGoals.set(id, newGoal);
    return newGoal;
  }

  async updateFinancialGoal(goalId: number, updates: Partial<FinancialGoal>): Promise<void> {
    const goal = this.financialGoals.get(goalId);
    if (goal) {
      Object.assign(goal, updates);
    }
  }

  async getUserAiTasks(userId: number, completed?: boolean): Promise<AiTask[]> {
    return Array.from(this.aiTasks.values())
      .filter(task => 
        task.userId === userId && 
        (completed === undefined || task.isCompleted === completed)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAiTask(task: InsertAiTask): Promise<AiTask> {
    const id = this.currentTaskId++;
    const newTask: AiTask = {
      ...task,
      id,
      createdAt: new Date(),
    };
    this.aiTasks.set(id, newTask);
    return newTask;
  }

  async completeAiTask(taskId: number): Promise<void> {
    const task = this.aiTasks.get(taskId);
    if (task) {
      task.isCompleted = true;
    }
  }

  async getUserDebtAccounts(userId: number): Promise<DebtAccount[]> {
    return Array.from(this.debtAccounts.values())
      .filter(debt => debt.userId === userId)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));
  }

  async createDebtAccount(debt: InsertDebtAccount): Promise<DebtAccount> {
    const id = this.currentDebtId++;
    const newDebt: DebtAccount = {
      ...debt,
      id,
    };
    this.debtAccounts.set(id, newDebt);
    return newDebt;
  }

  async updateDebtAccount(debtId: number, updates: Partial<DebtAccount>): Promise<void> {
    const debt = this.debtAccounts.get(debtId);
    if (debt) {
      Object.assign(debt, updates);
    }
  }

  async getUserInvestingAccount(userId: number): Promise<InvestingAccount | undefined> {
    return Array.from(this.investingAccounts.values()).find(account => account.userId === userId);
  }

  async createInvestingAccount(investing: InsertInvestingAccount): Promise<InvestingAccount> {
    const id = this.currentInvestingId++;
    const newInvesting: InvestingAccount = {
      ...investing,
      id,
    };
    this.investingAccounts.set(id, newInvesting);
    return newInvesting;
  }

  async updateInvestingAccount(accountId: number, updates: Partial<InvestingAccount>): Promise<void> {
    const account = this.investingAccounts.get(accountId);
    if (account) {
      Object.assign(account, updates);
    }
  }

  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(prefs => prefs.userId === userId);
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.currentPreferencesId++;
    const newPreferences: UserPreferences = {
      ...preferences,
      id,
    };
    this.userPreferences.set(id, newPreferences);
    return newPreferences;
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<void> {
    const preferences = Array.from(this.userPreferences.values()).find(p => p.userId === userId);
    if (preferences) {
      Object.assign(preferences, updates);
    }
  }
}

export const storage = new MemStorage();
