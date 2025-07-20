// Detects if a transaction is a paycheck
export function isPaycheck(tx: { amount: number; category: string }) {
  return tx.amount > 1000 && ['income', 'salary'].includes(tx.category.toLowerCase());
}

// Applies a budget rule (e.g., {save: 0.2, spend: 0.8})
export function applyBudgetRule(amount: number, rule: { save: number; spend: number }) {
  return {
    savingsTarget: Math.round(amount * rule.save),
    spendingBudget: Math.round(amount * rule.spend),
  };
} 