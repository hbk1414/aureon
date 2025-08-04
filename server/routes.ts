import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { financialAI } from "./services/financial-ai";
import { insertConnectedAccountSchema, insertAiTaskSchema, insertFinancialGoalSchema } from "@shared/schema";
import { z } from "zod";
import { getUpcomingRiskAlert, getGoalBlockingExpense, getRecurringWaste, getStreakWin, getLifeEventRadar, mockTransactions } from './services/financial-ai';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import axios from 'axios';
import qs from 'qs';

// Load environment variables
dotenv.config();

// Store access token globally (in production, use a proper session store)
let accessToken: string | null = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE0NTk4OUIwNTdDOUMzMzg0MDc4MDBBOEJBNkNCOUZFQjMzRTk1MTBSUzI1NiIsIng1dCI6IkZGbUpzRmZKd3poQWVBQ291bXk1X3JNLWxSQSIsInR5cCI6ImF0K2p3dCJ9.eyJpc3MiOiJodHRwczovL2F1dGgudHJ1ZWxheWVyLXNhbmRib3guY29tIiwibmJmIjoxNzUzNjI5MDU5LCJpYXQiOjE3NTM2MjkwNTksImV4cCI6MTc1MzYzMjY1OSwiYXVkIjoiZGF0YV9hcGkiLCJzY29wZSI6WyJpbmZvIiwiYWNjb3VudHMiXSwiYW1yIjpbInB3ZCJdLCJjbGllbnRfaWQiOiJzYW5kYm94LWF1cmVvbi01MmM5NmYiLCJzdWIiOiJWdHBYRFBuckRRaFhCVmQyc1RTcmVLV25Qb2s2TTE2VTJWYnJ4aklweW8wPSIsImF1dGhfdGltZSI6MTc1MzYyOTA1NSwiaWRwIjoibG9jYWwiLCJzaWQiOiJhZnNzLUVqT1hNVDRMendaU0tVSTlMcDNHR3JUNW5McUJQZ0R1Ukp4eWZJYlJTa1kiLCJjb25uZWN0b3JfaWQiOiJtb2NrIiwiY3JlZGVudGlhbHNfa2V5IjoiN2E4ZWUyMDExMDYwNjg2ZDg5NWFkYjhhYzNmNGFiZDZmMDJhYWUxNTkzYzYwNDgwZDYxNDJmOWVkZjAyODExZCIsInByaXZhY3lfcG9saWN5IjoiU2VwMjAyMyIsImNvbnNlbnRfaWQiOiJkZjRkNWUwYy05YzI2LTQ1ZDctYmYzZi0xOTg3ZDRlY2Y5MzYiLCJjb25zZW50X2V4cGlyeV90aW1lIjoxNzYxNDA1MDU0LCJjb25uZWN0aW9uX2lkIjoiYTE0MzM2ZjctMzNkMC00MTQ4LTg5ZTAtYzA5YzVmOGY1YTg3IiwianRpIjoiMDQ0MTEwNDUwMUQ0RjQ2M0QwMEYxQjY0MjIyNTYzQUEifQ.lBBs7zB39Mee-mQgfq8EVI1ZayZ4KWuUy_iCm6ZfqKcmNHE9RZY98-vfzUfUDW84Jlv82fuODFHUhsibCbhNs-u5zYPXaCx-zaSzlaAPt_tv51eL9x1-YL2LYubxXV6u9i6NtOtc_AXUW8KgRxbfC9N6nuAsykykVO46T4I76Aeqp3OKKxIEmhewmCw9XiugYrcS6eVXOzL5vwusLD4IdN5ENNE6LJYrvoAqPGVoIdmonbWfM7dDsxzotXAQjQe1ZbAAkW7BfjbKZXHwLAHjMsJb0sZMGhx4QVisD6FHvcBTIdPt8AJXaxa-gWO13MQB2-WDmZbk8fh-Otr7c_8cew";

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
  // TrueLayer authorization URL test route
  app.get("/auth", (req, res) => {
    const redirectUri = "https://ba6e2412-c2ea-4146-ad2a-b5577f22ae31-00-1b7wnubdw8c3h.riker.replit.dev:5000/callback";
    
    const authUrl = `https://auth.truelayer-sandbox.com/?response_type=code` +
      `&client_id=${process.env.TRUELAYER_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=info%20accounts%20balance%20transactions` +
      `&providers=mock` +
      `&state=abc123` +
      `&nonce=xyz456`;

    console.log("🔗 TrueLayer Auth URL:", authUrl);
    res.redirect(authUrl);
  });

  // TrueLayer OAuth callback route
  app.get("/callback", async (req, res) => {
    const code = req.query.code;
    const redirectUri = "https://ba6e2412-c2ea-4146-ad2a-b5577f22ae31-00-1b7wnubdw8c3h.riker.replit.dev:5000/callback";

    if (!code) {
      return res.send("❌ No authorization code returned.");
    }

    try {
      console.log("🔁 Attempting token exchange with:");
      console.log("👉 client_id:", process.env.TRUELAYER_CLIENT_ID);
      console.log("👉 client_secret (start):", process.env.TRUELAYER_CLIENT_SECRET?.slice(0, 6) + "...");
      console.log("👉 redirect_uri:", redirectUri);
      console.log("👉 code:", req.query.code);

      const response = await axios.post(
        "https://auth.truelayer-sandbox.com/connect/token",
        qs.stringify({
          grant_type: "authorization_code",
          client_id: process.env.TRUELAYER_CLIENT_ID,
          client_secret: process.env.TRUELAYER_CLIENT_SECRET,
          redirect_uri: redirectUri,
          code: req.query.code,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;

      console.log("✅ Access Token:", accessToken);
      console.log("🔄 Refresh Token:", refreshToken);

      // You can now fetch data using the access token (accounts, balances, etc)
      res.send("✅ Successfully connected to Mock Bank and received access token!");
    } catch (error: any) {
      console.error("❌ Token exchange failed:", error.response?.data || error.message);
      res.send("❌ Token exchange failed: " + (error.response?.data?.error_description || error.message));
    }
  });

  // GET /accounts — fetch user's bank accounts with fallback demo data
  app.get("/api/accounts", async (req, res) => {
    // Enhanced demo accounts for consistent display - only 2 accounts
    const demoAccounts = {
      results: [
        {
          update_timestamp: new Date().toISOString(),
          account_id: "56c7b029e0f8ec5a2334fb0ffc2fface",
          account_type: "TRANSACTION",
          display_name: "TRANSACTION ACCOUNT",
          currency: "GBP",
          account_number: {
            iban: "GB08CLRB04066800003435",
            swift_bic: "CPBKGB00",
            number: "10000000",
            sort_code: "01-21-31"
          },
          provider: {
            display_name: "MOCK",
            provider_id: "mock",
            logo_uri: "https://truelayer-client-logos.s3-eu-west-1.amazonaws.com/banks/banks-icons/mock-icon.svg"
          }
        },
        {
          update_timestamp: new Date().toISOString(),
          account_id: "3c6edb9484ecd581dc1cedde8bedb1f1",
          account_type: "SAVINGS",
          display_name: "SAVINGS ACCOUNT",
          currency: "GBP",
          account_number: {
            iban: "GB08CLRB04066800003435",
            swift_bic: "CPBKGB00",
            number: "20000000",
            sort_code: "01-21-31"
          },
          provider: {
            display_name: "MOCK",
            provider_id: "mock",
            logo_uri: "https://truelayer-client-logos.s3-eu-west-1.amazonaws.com/banks/banks-icons/mock-icon.svg"
          }
        }
      ],
      status: "Succeeded"
    };

    if (!accessToken) {
      console.log("🔄 No access token - providing demo accounts");
      return res.json(demoAccounts);
    }

    try {
      const response = await axios.get("https://api.truelayer-sandbox.com/data/v1/accounts", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("❌ Account fetch failed, providing demo accounts:", error.response?.data || error.message);
      res.json(demoAccounts);
    }
  });

  // GET /accounts/:accountId/balance — fetch account balance with enhanced data
  app.get("/api/accounts/:accountId/balance", async (req, res) => {
    const { accountId } = req.params;
    
    // Enhanced demo balances for consistent display - only 2 accounts
    const enhancedBalances: Record<string, any> = {
      "56c7b029e0f8ec5a2334fb0ffc2fface": { currency: "GBP", current: 2340.50, available: 2340.50, overdraft: 0 },
      "3c6edb9484ecd581dc1cedde8bedb1f1": { currency: "GBP", current: 5680.25, available: 5680.25, overdraft: 0 }
    };

    // Always provide enhanced balances for demonstration
    if (enhancedBalances[accountId]) {
      const enhancedBalance = enhancedBalances[accountId];
      return res.json({
        results: [{
          currency: enhancedBalance.currency,
          current: enhancedBalance.current,
          available: enhancedBalance.available,
          overdraft: enhancedBalance.overdraft,
          update_timestamp: new Date().toISOString()
        }],
        status: "Succeeded"
      });
    }

    if (!accessToken) {
      return res.status(401).send("Access token not available for unknown account.");
    }

    try {
      const response = await axios.get(`https://api.truelayer-sandbox.com/data/v1/accounts/${accountId}/balance`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("❌ Balance fetch failed:", error.response?.data || error.message);
      res.status(500).send("❌ Balance fetch failed: " + (error.response?.data?.message || error.message));
    }
  });

  // GET /accounts/:accountId/transactions — fetch account transactions with enhanced mock data
  app.get("/api/accounts/:accountId/transactions", async (req, res) => {
    const { accountId } = req.params;
    
    if (!accessToken) {
      return res.status(401).send("Access token not available.");
    }

    try {
      // Enhanced mock transactions with more variety - only 2 accounts
      const enhancedTransactions: Record<string, any[]> = {
        "56c7b029e0f8ec5a2334fb0ffc2fface": [
          { transaction_id: "tx1", amount: 2500.00, currency: "GBP", description: "SALARY PAYMENT", transaction_type: "CREDIT", timestamp: "2025-08-01T09:00:00Z", merchant_name: "Employer Ltd" },
          { transaction_id: "tx2", amount: -850.00, currency: "GBP", description: "RENT PAYMENT", transaction_type: "DEBIT", timestamp: "2025-08-01T10:00:00Z", merchant_name: "Property Management" },
          { transaction_id: "tx3", amount: -45.60, currency: "GBP", description: "TESCO EXTRA", transaction_type: "DEBIT", timestamp: "2025-08-03T14:30:00Z", merchant_name: "Tesco" },
          { transaction_id: "tx4", amount: -89.99, currency: "GBP", description: "AMAZON.CO.UK", transaction_type: "DEBIT", timestamp: "2025-07-30T16:45:00Z", merchant_name: "Amazon" },
          { transaction_id: "tx5", amount: -12.50, currency: "GBP", description: "COSTA COFFEE", transaction_type: "DEBIT", timestamp: "2025-07-31T08:15:00Z", merchant_name: "Costa Coffee" },
          { transaction_id: "tx6", amount: -67.80, currency: "GBP", description: "SHELL PETROL", transaction_type: "DEBIT", timestamp: "2025-07-29T07:45:00Z", merchant_name: "Shell" },
          { transaction_id: "tx7", amount: -125.40, currency: "GBP", description: "SAINSBURYS", transaction_type: "DEBIT", timestamp: "2025-07-28T19:30:00Z", merchant_name: "Sainsburys" },
          { transaction_id: "tx8", amount: -35.99, currency: "GBP", description: "NETFLIX", transaction_type: "DEBIT", timestamp: "2025-07-28T00:01:00Z", merchant_name: "Netflix" },
          { transaction_id: "tx9", amount: -8.40, currency: "GBP", description: "STARBUCKS", transaction_type: "DEBIT", timestamp: "2025-07-27T08:20:00Z", merchant_name: "Starbucks" },
          { transaction_id: "tx10", amount: -15.99, currency: "GBP", description: "SPOTIFY", transaction_type: "DEBIT", timestamp: "2025-07-26T12:00:00Z", merchant_name: "Spotify" },
          { transaction_id: "tx11", amount: -2.50, currency: "GBP", description: "BUS FARE", transaction_type: "DEBIT", timestamp: "2025-07-26T09:15:00Z", merchant_name: "TfL" },
          { transaction_id: "tx12", amount: -78.50, currency: "GBP", description: "ELECTRICITY BILL", transaction_type: "DEBIT", timestamp: "2025-07-25T14:30:00Z", merchant_name: "British Gas" },
          { transaction_id: "tx13", amount: -42.00, currency: "GBP", description: "INTERNET BILL", transaction_type: "DEBIT", timestamp: "2025-07-24T11:00:00Z", merchant_name: "BT" },
          { transaction_id: "tx14", amount: -18.99, currency: "GBP", description: "DISNEY+", transaction_type: "DEBIT", timestamp: "2025-07-23T00:01:00Z", merchant_name: "Disney Plus" },
          { transaction_id: "tx15", amount: -120.00, currency: "GBP", description: "COUNCIL TAX", transaction_type: "DEBIT", timestamp: "2025-07-22T10:00:00Z", merchant_name: "Local Council" }
        ],
        "3c6edb9484ecd581dc1cedde8bedb1f1": [
          { transaction_id: "tx16", amount: 500.00, currency: "GBP", description: "MONTHLY SAVINGS", transaction_type: "CREDIT", timestamp: "2025-08-01T10:00:00Z", merchant_name: "Transfer" },
          { transaction_id: "tx17", amount: 1200.00, currency: "GBP", description: "BONUS PAYMENT", transaction_type: "CREDIT", timestamp: "2025-07-25T15:30:00Z", merchant_name: "Employer Ltd" },
          { transaction_id: "tx18", amount: 300.00, currency: "GBP", description: "FREELANCE WORK", transaction_type: "CREDIT", timestamp: "2025-07-20T14:00:00Z", merchant_name: "Client Ltd" },
          { transaction_id: "tx19", amount: -200.00, currency: "GBP", description: "INVESTMENT TRANSFER", transaction_type: "DEBIT", timestamp: "2025-07-20T11:00:00Z", merchant_name: "Investment Fund" },
          { transaction_id: "tx20", amount: 25.00, currency: "GBP", description: "CASHBACK REWARD", transaction_type: "CREDIT", timestamp: "2025-07-18T16:30:00Z", merchant_name: "Bank Reward" },
          { transaction_id: "tx21", amount: 150.00, currency: "GBP", description: "TAX REFUND", transaction_type: "CREDIT", timestamp: "2025-07-15T09:00:00Z", merchant_name: "HMRC" },
          { transaction_id: "tx22", amount: 75.00, currency: "GBP", description: "DIVIDEND PAYMENT", transaction_type: "CREDIT", timestamp: "2025-07-10T11:30:00Z", merchant_name: "Investment Co" },
          { transaction_id: "tx23", amount: 450.00, currency: "GBP", description: "EMERGENCY FUND", transaction_type: "CREDIT", timestamp: "2025-07-01T12:00:00Z", merchant_name: "Transfer" },
          { transaction_id: "tx24", amount: -100.00, currency: "GBP", description: "CHARITY DONATION", transaction_type: "DEBIT", timestamp: "2025-06-28T10:00:00Z", merchant_name: "Charity" },
          { transaction_id: "tx25", amount: 800.00, currency: "GBP", description: "HOLIDAY SAVINGS", transaction_type: "CREDIT", timestamp: "2025-06-25T14:00:00Z", merchant_name: "Transfer" }
        ]
      };

      try {
        const response = await axios.get(`https://api.truelayer-sandbox.com/data/v1/accounts/${accountId}/transactions`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Use enhanced transactions if available, otherwise use real TrueLayer data
        if (enhancedTransactions[accountId]) {
          res.json({
            results: enhancedTransactions[accountId],
            status: "Succeeded"
          });
        } else {
          res.json(response.data);
        }
      } catch (error: any) {
        // If TrueLayer fails, still provide enhanced transactions for demo
        if (enhancedTransactions[accountId]) {
          res.json({
            results: enhancedTransactions[accountId],
            status: "Succeeded"
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error("❌ Transactions fetch failed:", error.response?.data || error.message);
      res.status(500).send("❌ Transactions fetch failed: " + (error.response?.data?.message || error.message));
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
