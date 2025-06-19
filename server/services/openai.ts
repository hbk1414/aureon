import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface FinancialAnalysisInput {
  userProfile: {
    income: number;
    expenses: number;
    debt: number;
    savings: number;
    goals: string[];
  };
  transactions: Array<{
    amount: number;
    category: string;
    merchant: string;
    date: string;
  }>;
  accounts: Array<{
    type: string;
    balance: number;
  }>;
}

export interface AITaskRecommendation {
  title: string;
  description: string;
  taskType: 'daily' | 'weekly' | 'monthly';
  category: 'debt' | 'savings' | 'investing' | 'budgeting';
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
  actionItems: string[];
}

export interface DebtOptimizationStrategy {
  method: 'avalanche' | 'snowball' | 'hybrid';
  totalInterestSaved: number;
  timeToDebtFree: number; // months
  monthlyPaymentPlan: Array<{
    debtName: string;
    suggestedPayment: number;
    reasoning: string;
  }>;
  priorityOrder: Array<{
    debtName: string;
    priority: number;
    reasoning: string;
  }>;
}

export async function generateFinancialTasks(input: FinancialAnalysisInput): Promise<AITaskRecommendation[]> {
  try {
    const prompt = `As an AI financial advisor, analyze the following user's financial data and generate 3-5 specific, actionable financial tasks for daily, weekly, and monthly schedules.

User Financial Profile:
- Monthly Income: $${input.userProfile.income}
- Monthly Expenses: $${input.userProfile.expenses}
- Total Debt: $${input.userProfile.debt}
- Total Savings: $${input.userProfile.savings}
- Financial Goals: ${input.userProfile.goals.join(", ")}

Recent Transactions (last 30 days):
${input.transactions.slice(0, 10).map(t => `- ${t.merchant}: $${Math.abs(t.amount)} (${t.category})`).join("\n")}

Account Balances:
${input.accounts.map(a => `- ${a.type}: $${a.balance}`).join("\n")}

Generate specific, actionable tasks that will help improve their financial situation. Each task should include:
- A clear, specific title
- Detailed description with exact actions to take
- Task frequency (daily/weekly/monthly)
- Category (debt/savings/investing/budgeting)
- Priority level (high/medium/low)
- Estimated financial impact
- Step-by-step action items

Respond with a JSON array of task objects.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert financial advisor AI. Provide specific, actionable financial advice based on real financial data. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.tasks || [];
  } catch (error) {
    console.error("Error generating financial tasks:", error);
    throw new Error("Failed to generate AI financial tasks");
  }
}

export async function optimizeDebtPayoffStrategy(debts: Array<{
  name: string;
  balance: number;
  apr: number;
  minimumPayment: number;
}>, availableExtraPayment: number): Promise<DebtOptimizationStrategy> {
  try {
    const prompt = `As an AI debt optimization expert, analyze these debts and create an optimal payoff strategy:

Debts:
${debts.map(d => `- ${d.name}: $${d.balance} balance, ${d.apr}% APR, $${d.minimumPayment} minimum payment`).join("\n")}

Available extra payment amount: $${availableExtraPayment}/month

Calculate the optimal debt payoff strategy considering:
1. Total interest savings
2. Time to become debt-free
3. Psychological factors (small wins vs. mathematical optimization)
4. Cash flow considerations

Provide specific monthly payment recommendations for each debt and explain the reasoning. Include priority order and estimated financial impact.

Respond with a JSON object containing the complete strategy.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert debt optimization AI. Provide mathematically sound debt payoff strategies with clear explanations. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("Error optimizing debt strategy:", error);
    throw new Error("Failed to optimize debt payoff strategy");
  }
}

export async function generateSavingsRecommendations(input: {
  monthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  savingsGoals: Array<{ name: string; target: number; deadline?: string }>;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}): Promise<{
  emergencyFundRecommendation: {
    targetAmount: number;
    monthlySavings: number;
    timeToGoal: number;
    reasoning: string;
  };
  goalBasedRecommendations: Array<{
    goalName: string;
    monthlySavings: number;
    investmentVehicle: string;
    reasoning: string;
  }>;
  automationSuggestions: string[];
}> {
  try {
    const prompt = `As an AI savings optimization expert, analyze this financial profile and provide specific savings recommendations:

Monthly Income: $${input.monthlyIncome}
Monthly Expenses: $${input.monthlyExpenses}
Current Savings: $${input.currentSavings}
Risk Tolerance: ${input.riskTolerance}

Savings Goals:
${input.savingsGoals.map(g => `- ${g.name}: $${g.target}${g.deadline ? ` by ${g.deadline}` : ""}`).join("\n")}

Provide specific recommendations for:
1. Emergency fund target and monthly savings plan
2. Goal-based savings strategies with specific investment vehicles
3. Automation suggestions for consistent saving

Consider their risk tolerance and timeline. Provide actionable, specific advice with dollar amounts and timeframes.

Respond with a JSON object containing detailed recommendations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert savings and investment AI advisor. Provide specific, actionable savings strategies with clear reasoning. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("Error generating savings recommendations:", error);
    throw new Error("Failed to generate savings recommendations");
  }
}
