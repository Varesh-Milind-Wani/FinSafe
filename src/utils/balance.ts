import type { UserAccount } from '../types/finance';

/**
 * Calculate current balance consistently across all pages
 * Uses manual currentBalance if set, otherwise calculates from transactions
 * Uses grossAmount for all calculations for consistency
 */
export const calculateCurrentBalance = (user: UserAccount): number => {
  // If there's a manual balance override, use it (for rebalancing)
  if (user.currentBalance !== undefined && user.currentBalance !== null) {
    return user.currentBalance;
  }

  // Otherwise calculate from transactions using gross amounts (before cost deduction)
  const totalProfit = user.transactions
    .filter((transaction) => transaction.type === "profit")
    .reduce((sum, transaction) => sum + (transaction.grossAmount ?? transaction.amount), 0);

  const totalLoss = user.transactions
    .filter((transaction) => transaction.type === "loss")
    .reduce((sum, transaction) => sum + (transaction.grossAmount ?? transaction.amount), 0);

  return user.startingBalance + totalProfit - totalLoss;
};

/**
 * Calculate comprehensive balance statistics
 * Uses manual currentBalance if set for balance calculation
 * Uses grossAmount for display of total profit/loss amounts
 */
export const calculateBalanceStats = (user: UserAccount) => {
  // For display amounts, use gross amounts (before cost deduction)  
  const totalProfit = user.transactions
    .filter((transaction) => transaction.type === "profit")
    .reduce((sum, transaction) => sum + (transaction.grossAmount ?? transaction.amount), 0);

  const totalLoss = user.transactions
    .filter((transaction) => transaction.type === "loss")
    .reduce((sum, transaction) => sum + (transaction.grossAmount ?? transaction.amount), 0);

  // Use manual balance if set, otherwise calculate from net transaction amounts
  const currentBalance = calculateCurrentBalance(user);
  const netPerformance = currentBalance - user.startingBalance;

  return {
    totalProfit,
    totalLoss,
    currentBalance,
    netPerformance,
    startingBalance: user.startingBalance,
  };
};