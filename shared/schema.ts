import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const connectedAccounts = pgTable("connected_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bankName: text("bank_name").notNull(),
  accountType: text("account_type").notNull(), // 'checking', 'savings', 'credit'
  accountNumber: text("account_number").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
  isConnected: boolean("is_connected").default(true).notNull(),
  lastSync: timestamp("last_sync").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => connectedAccounts.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  merchant: text("merchant").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  roundUp: decimal("round_up", { precision: 12, scale: 2 }),
});

export const financialGoals = pgTable("financial_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'emergency_fund', 'debt_payoff', 'savings'
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  deadline: timestamp("deadline"),
  isCompleted: boolean("is_completed").default(false).notNull(),
});

export const aiTasks = pgTable("ai_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  taskType: text("task_type").notNull(), // 'daily', 'weekly', 'monthly'
  category: text("category").notNull(), // 'debt', 'savings', 'investing', 'budgeting'
  priority: text("priority").notNull(), // 'high', 'medium', 'low'
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  metadata: jsonb("metadata"), // Additional AI-generated context
});

export const debtAccounts = pgTable("debt_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
  apr: decimal("apr", { precision: 5, scale: 2 }).notNull(),
  minimumPayment: decimal("minimum_payment", { precision: 12, scale: 2 }).notNull(),
  suggestedPayment: decimal("suggested_payment", { precision: 12, scale: 2 }),
  priority: integer("priority"), // AI-determined payoff priority
});

export const investingAccounts = pgTable("investing_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  totalInvested: decimal("total_invested", { precision: 12, scale: 2 }).default("0").notNull(),
  totalReturns: decimal("total_returns", { precision: 12, scale: 2 }).default("0").notNull(),
  roundUpEnabled: boolean("round_up_enabled").default(true).notNull(),
  monthlyRoundUps: decimal("monthly_round_ups", { precision: 12, scale: 2 }).default("0").notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  monthlyBudget: decimal("monthly_budget", { precision: 12, scale: 2 }),
  emergencyFundMonths: integer("emergency_fund_months").default(3).notNull(),
  riskTolerance: text("risk_tolerance").default("moderate").notNull(), // 'conservative', 'moderate', 'aggressive'
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
});

export const couples = pgTable("couples", {
  id: serial("id").primaryKey(),
  primaryUserId: integer("primary_user_id").notNull().references(() => users.id),
  partnerUserId: integer("partner_user_id").notNull().references(() => users.id),
  relationshipType: text("relationship_type").notNull().default("spouse"), // spouse, partner, sibling
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sharedGoals = pgTable("shared_goals", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id),
  title: text("title").notNull(),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  deadline: timestamp("deadline"),
  category: text("category").notNull(), // vacation, house, emergency, wedding
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sharedGoalContributions = pgTable("shared_goal_contributions", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => sharedGoals.id),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  contributedAt: timestamp("contributed_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertConnectedAccountSchema = createInsertSchema(connectedAccounts).omit({ id: true, lastSync: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertFinancialGoalSchema = createInsertSchema(financialGoals).omit({ id: true });
export const insertAiTaskSchema = createInsertSchema(aiTasks).omit({ id: true, createdAt: true });
export const insertDebtAccountSchema = createInsertSchema(debtAccounts).omit({ id: true });
export const insertInvestingAccountSchema = createInsertSchema(investingAccounts).omit({ id: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true });
export const insertCoupleSchema = createInsertSchema(couples).omit({ id: true, createdAt: true });
export const insertSharedGoalSchema = createInsertSchema(sharedGoals).omit({ id: true, createdAt: true });
export const insertSharedGoalContributionSchema = createInsertSchema(sharedGoalContributions).omit({ id: true, contributedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
export type InsertConnectedAccount = z.infer<typeof insertConnectedAccountSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type FinancialGoal = typeof financialGoals.$inferSelect;
export type InsertFinancialGoal = z.infer<typeof insertFinancialGoalSchema>;
export type AiTask = typeof aiTasks.$inferSelect;
export type InsertAiTask = z.infer<typeof insertAiTaskSchema>;
export type DebtAccount = typeof debtAccounts.$inferSelect;
export type InsertDebtAccount = z.infer<typeof insertDebtAccountSchema>;
export type InvestingAccount = typeof investingAccounts.$inferSelect;
export type InsertInvestingAccount = z.infer<typeof insertInvestingAccountSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type Couple = typeof couples.$inferSelect;
export type InsertCouple = z.infer<typeof insertCoupleSchema>;
export type SharedGoal = typeof sharedGoals.$inferSelect;
export type InsertSharedGoal = z.infer<typeof insertSharedGoalSchema>;
export type SharedGoalContribution = typeof sharedGoalContributions.$inferSelect;
export type InsertSharedGoalContribution = z.infer<typeof insertSharedGoalContributionSchema>;
