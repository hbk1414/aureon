import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { financialAI } from "./services/financial-ai";
import { insertConnectedAccountSchema, insertAiTaskSchema, insertFinancialGoalSchema } from "@shared/schema";
import { z } from "zod";
import { getUpcomingRiskAlert, getGoalBlockingExpense, getRecurringWaste, getStreakWin, getLifeEventRadar, mockTransactions } from './services/financial-ai';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// TrueLayer OAuth callback interface
interface TrueLayerTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface TrueLayerError {
  error: string;
  error_description?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // TrueLayer OAuth callback route
  app.get("/callback", async (req, res) => {
    try {
      const { code, error, error_description } = req.query;

      // Handle OAuth errors
      if (error) {
        console.error('TrueLayer OAuth error:', error, error_description);
        return res.redirect(`https://ba6e2412-c2ea-4146-ad2a-b5577f22ae31-00-1b7wnubdw8c3h.riker.replit.dev:5000/dashboard?error=${encodeURIComponent(String(error))}`);
      }

      // Validate authorization code
      if (!code || typeof code !== 'string') {
        console.error('No authorization code received');
        return res.redirect('https://ba6e2412-c2ea-4146-ad2a-b5577f22ae31-00-1b7wnubdw8c3h.riker.replit.dev:5000/dashboard?error=no_code');
      }

      // Validate environment variables
      const clientId = process.env.TRUELAYER_CLIENT_ID;
      const clientSecret = process.env.TRUELAYER_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.error('TrueLayer credentials not configured');
        return res.redirect('https://ba6e2412-c2ea-4146-ad2a-b5577f22ae31-00-1b7wnubdw8c3h.riker.replit.dev:5000/dashboard?error=config_error');
      }

      console.log('Exchanging authorization code for access token...');

      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://auth.truelayer.com/connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: 'https://ba6e2412-c2ea-4146-ad2a-b5577f22ae31-00-1b7wnubdw8c3h.riker.replit.dev:5000/callback', // Specific Replit URI
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json() as TrueLayerTokenResponse | TrueLayerError;

      if (!tokenResponse.ok || 'error' in tokenData) {
        console.error('TrueLayer token exchange failed:', tokenData);
        const errorMsg = 'error' in tokenData ? tokenData.error : 'token_exchange_failed';
        return res.redirect(`https://ba6e2412-c2ea-4146-ad2a-b5577f22ae31-00-1b7wnubdw8c3h.riker.replit.dev:5000/dashboard?error=${encodeURIComponent(errorMsg)}`);
      }

      console.log('Token exchange successful, redirecting with access token');

      // Redirect back to dashboard with access token
      const redirectUrl = `https://ba6e2412-c2ea-4146-ad2a-b5577f22ae31-00-1b7wnubdw8c3h.riker.replit.dev:5000/dashboard?token=${encodeURIComponent(tokenData.access_token)}`;
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('Callback handler error:', error);
      res.redirect('https://ba6e2412-c2ea-4146-ad2a-b5577f22ae31-00-1b7wnubdw8c3h.riker.replit.dev:5000/dashboard?error=server_error');
    }
  });

  // Brandfetch API proxy endpoint
  app.get("/api/merchant-logo/:merchantName", async (req, res) => {
    try {
      const { merchantName } = req.params;
      
      if (!process.env.BRANDFETCH_API_KEY) {
        return res.status(500).json({ error: "Brandfetch API key not configured" });
      }

      // Convert merchant name to likely domain
      const domain = merchantNameToDomain(merchantName);
      
      const response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
        headers: {
          'Authorization': `Bearer ${process.env.BRANDFETCH_API_KEY}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch logo" });
      }

      const data = await response.json() as any;
      
      // Find the best logo
      const bestLogo = findBestLogo(data.logos);
      
      res.json({ logoUrl: bestLogo });
    } catch (error) {
      console.error('Error fetching merchant logo:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  function merchantNameToDomain(merchantName: string): string {
    const domainMap: Record<string, string> = {
      'Costa Coffee': 'costa.co.uk',
      'Tesco': 'tesco.com',
      'Tesco Express': 'tesco.com',
      'Sainsbury\'s': 'sainsburys.co.uk',
      'ASDA': 'asda.com',
      'Morrisons': 'morrisons.com',
      'M&S': 'marksandspencer.com',
      'Marks & Spencer': 'marksandspencer.com',
      'Waitrose': 'waitrose.com',
      'TfL': 'tfl.gov.uk',
      'TfL Oyster': 'tfl.gov.uk',
      'Transport for London': 'tfl.gov.uk',
      'McDonald\'s': 'mcdonalds.com',
      'Subway': 'subway.com',
      'Greggs': 'greggs.co.uk',
      'Starbucks': 'starbucks.com',
      'Pret A Manger': 'pret.com',
      'John Lewis': 'johnlewis.com',
      'Argos': 'argos.co.uk',
      'Currys': 'currys.co.uk',
      'Amazon': 'amazon.co.uk',
      'eBay': 'ebay.co.uk',
      'PayPal': 'paypal.com',
      'Netflix': 'netflix.com',
      'Spotify': 'spotify.com',
      'Apple': 'apple.com',
      'Google': 'google.com',
      'Microsoft': 'microsoft.com',
      'Shell': 'shell.com',
      'BP': 'bp.com',
      'Esso': 'esso.co.uk'
    };

    const domain = domainMap[merchantName];
    if (domain) {
      return domain;
    }

    return merchantName
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '')
      .concat('.com');
  }

  function findBestLogo(logos: any[]): string | null {
    if (!logos || logos.length === 0) return null;

    // Prefer icon type first, then logo type
    const preferredTypes = ['icon', 'logo', 'symbol', 'mark'];
    
    for (const type of preferredTypes) {
      const logoOfType = logos.find((logo: any) => logo.type === type);
      if (logoOfType && logoOfType.formats && logoOfType.formats.length > 0) {
        // Prefer PNG format for better compatibility, then SVG
        const preferredFormats = ['png', 'svg', 'jpeg'];
        
        for (const format of preferredFormats) {
          const logoFormat = logoOfType.formats.find((f: any) => f.format === format);
          if (logoFormat && logoFormat.src) {
            return logoFormat.src;
          }
        }
        
        // If no preferred format found, use the first available
        if (logoOfType.formats[0] && logoOfType.formats[0].src) {
          return logoOfType.formats[0].src;
        }
      }
    }

    // Fallback to first logo's first format
    if (logos[0] && logos[0].formats && logos[0].formats.length > 0 && logos[0].formats[0].src) {
      return logos[0].formats[0].src;
    }

    return null;
  }
  // Dashboard data endpoint
  app.get("/api/dashboard/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const [
        user,
        connectedAccounts,
        transactions,
        financialGoals,
        aiTasks,
        debtAccounts,
        investingAccount,
        preferences,
        couple
      ] = await Promise.all([
        storage.getUser(userId),
        storage.getConnectedAccounts(userId),
        storage.getUserTransactions(userId, 10),
        storage.getUserFinancialGoals(userId),
        storage.getUserAiTasks(userId, false), // Only incomplete tasks
        storage.getUserDebtAccounts(userId),
        storage.getUserInvestingAccount(userId),
        storage.getUserPreferences(userId),
        storage.getUserCouple(userId)
      ]);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get couples data
      let partner = null;
      let sharedGoals = [];
      let couplesSavings = null;
      
      if (couple) {
        const partnerId = couple.primaryUserId === userId ? couple.partnerUserId : couple.primaryUserId;
        const partnerUser = await storage.getUser(partnerId);
        if (partnerUser) {
          partner = {
            name: `${partnerUser.firstName} ${partnerUser.lastName}`,
            relationshipType: couple.relationshipType
          };
        }
        
        sharedGoals = await storage.getCoupleSharedGoals(couple.id);
        
        // Calculate couples savings totals
        const totalSaved = sharedGoals.reduce((sum, goal) => sum + parseFloat(goal.currentAmount.toString()), 0);
        couplesSavings = {
          totalSaved: Math.round(totalSaved),
          monthlyContribution: 450 // Mock monthly contribution
        };
        
        // Add progress percentage to goals
        sharedGoals = sharedGoals.map(goal => ({
          ...goal,
          progress: Math.round((parseFloat(goal.currentAmount.toString()) / parseFloat(goal.targetAmount.toString())) * 100)
        }));
      }

      // Calculate spending categories
      const spendingCategories = transactions.reduce((acc, transaction) => {
        const amount = Math.abs(parseFloat(transaction.amount));
        if (amount > 0) { // Only count expenses
          if (!acc[transaction.category]) {
            acc[transaction.category] = { total: 0, count: 0 };
          }
          acc[transaction.category].total += amount;
          acc[transaction.category].count += 1;
        }
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const totalSpent = Object.values(spendingCategories).reduce((sum, cat) => sum + cat.total, 0);
      const monthlyBudget = parseFloat(preferences?.monthlyBudget || "4000");

      const spendingCategoriesArray = Object.entries(spendingCategories).map(([category, data]) => ({
        name: category,
        amount: data.total,
        transactions: data.count,
        percentage: (data.total / totalSpent) * 100,
      })).sort((a, b) => b.amount - a.amount);

      // Calculate emergency fund progress
      const emergencyGoal = financialGoals.find(g => g.type === "emergency_fund");
      const emergencyFundProgress = emergencyGoal ? {
        current: parseFloat(emergencyGoal.currentAmount),
        goal: parseFloat(emergencyGoal.targetAmount),
        percentage: Math.round((parseFloat(emergencyGoal.currentAmount) / parseFloat(emergencyGoal.targetAmount)) * 100),
        remaining: parseFloat(emergencyGoal.targetAmount) - parseFloat(emergencyGoal.currentAmount),
      } : null;

      res.json({
        user: {
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          initials: `${user.firstName[0]}${user.lastName[0]}`,
        },
        portfolio: {
          totalBalance: connectedAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0),
        },
        connectedAccounts,
        spending: {
          total: totalSpent,
          budget: monthlyBudget,
          remaining: monthlyBudget - totalSpent,
          categories: spendingCategoriesArray,
        },
        debtAccounts,
        investingAccount,
        aiTasks,
        emergencyFund: emergencyFundProgress,
        stats: {
          creditScore: 742, // Mock credit score
          savingsRate: Math.round(((monthlyBudget - totalSpent) / monthlyBudget) * 100),
          debtFreeDays: debtAccounts.length > 0 ? 247 : 0, // Mock calculation
        },
        recentTransactions: transactions.slice(0, 5),
        partner,
        sharedGoals,
        couplesSavings
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Smart Insights API endpoint
  app.get('/api/insights', async (req, res) => {
    // In production, fetch user transactions from Firestore or DB
    // For now, use mockTransactions
    const insights = [
      getUpcomingRiskAlert(),
      getGoalBlockingExpense(),
      getRecurringWaste(),
      getStreakWin(),
      getLifeEventRadar(),
    ].filter(Boolean);
    res.json({ insights });
  });

  // Connect new account
  app.post("/api/accounts", async (req, res) => {
    try {
      const accountData = insertConnectedAccountSchema.parse(req.body);
      const account = await storage.createConnectedAccount(accountData);
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid account data", errors: error.errors });
      }
      console.error("Connect account error:", error);
      res.status(500).json({ message: "Failed to connect account" });
    }
  });

  // Generate AI tasks
  app.post("/api/ai/generate-tasks/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { taskType } = req.body;

      switch (taskType) {
        case "daily":
          await financialAI.generateDailyTasks(userId);
          break;
        case "weekly":
          await financialAI.generateWeeklyTasks(userId);
          break;
        case "monthly":
          await financialAI.generateMonthlyTasks(userId);
          break;
        default:
          // Generate all types
          await Promise.all([
            financialAI.generateDailyTasks(userId),
            financialAI.generateWeeklyTasks(userId),
            financialAI.generateMonthlyTasks(userId),
          ]);
      }

      res.json({ message: "AI tasks generated successfully" });
    } catch (error) {
      console.error("Generate AI tasks error:", error);
      res.status(500).json({ message: "Failed to generate AI tasks" });
    }
  });

  // Complete AI task
  app.patch("/api/ai/tasks/:taskId/complete", async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      await storage.completeAiTask(taskId);
      res.json({ message: "Task completed" });
    } catch (error) {
      console.error("Complete task error:", error);
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  // Optimize debt strategy
  app.post("/api/ai/optimize-debt/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      await financialAI.optimizeDebtStrategy(userId);
      res.json({ message: "Debt strategy optimized" });
    } catch (error) {
      console.error("Optimize debt error:", error);
      res.status(500).json({ message: "Failed to optimize debt strategy" });
    }
  });

  // Generate savings strategy
  app.post("/api/ai/savings-strategy/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      await financialAI.generateSavingsStrategy(userId);
      res.json({ message: "Savings strategy generated" });
    } catch (error) {
      console.error("Generate savings strategy error:", error);
      res.status(500).json({ message: "Failed to generate savings strategy" });
    }
  });

  // Toggle micro-investing
  app.patch("/api/investing/:userId/toggle-roundup", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { enabled } = req.body;
      
      const investingAccount = await storage.getUserInvestingAccount(userId);
      if (investingAccount) {
        await storage.updateInvestingAccount(investingAccount.id, {
          roundUpEnabled: enabled,
        });
      }
      
      res.json({ message: "Round-up investing toggled" });
    } catch (error) {
      console.error("Toggle roundup error:", error);
      res.status(500).json({ message: "Failed to toggle round-up investing" });
    }
  });

  // Add to emergency fund
  app.post("/api/emergency-fund/:userId/add", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { amount } = req.body;
      
      const goals = await storage.getUserFinancialGoals(userId);
      const emergencyGoal = goals.find(g => g.type === "emergency_fund");
      
      if (emergencyGoal) {
        const newAmount = parseFloat(emergencyGoal.currentAmount) + parseFloat(amount);
        await storage.updateFinancialGoal(emergencyGoal.id, {
          currentAmount: newAmount.toString(),
          isCompleted: newAmount >= parseFloat(emergencyGoal.targetAmount),
        });
      }
      
      res.json({ message: "Emergency fund updated" });
    } catch (error) {
      console.error("Add to emergency fund error:", error);
      res.status(500).json({ message: "Failed to add to emergency fund" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
