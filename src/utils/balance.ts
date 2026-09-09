import type { UserAccount } from '../types/finance';

/**
 * Calculate current balance consistently across all pages
 * Uses net amount (transaction.amount) which is after cost deduction
 */
export const calculateCurrentBalance = (user: UserAccount): number => {
  const totalProfit = user.transactions
    .filter((transaction) => transaction.type === "profit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalLoss = user.transactions
    .filter((transaction) => transaction.type === "loss")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return user.startingBalance + totalProfit - totalLoss;
};

/**
 * Calculate comprehensive balance statistics
 * Uses net amount (transaction.amount) for balance calculation
 * Uses grossAmount for display of total profit/loss amounts
 */
export const calculateBalanceStats = (user: UserAccount) => {
  // For balance calculation, use net amounts (after cost deduction)
  const netProfit = user.transactions
    .filter((transaction) => transaction.type === "profit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const netLoss = user.transactions
    .filter((transaction) => transaction.type === "loss")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  // For display amounts, use gross amounts (before cost deduction)  
  const totalProfit = user.transactions
    .filter((transaction) => transaction.type === "profit")
    .reduce((sum, transaction) => sum + (transaction.grossAmount ?? transaction.amount), 0);

  const totalLoss = user.transactions
    .filter((transaction) => transaction.type === "loss")
    .reduce((sum, transaction) => sum + (transaction.grossAmount ?? transaction.amount), 0);

  const currentBalance = user.startingBalance + netProfit - netLoss;
  const netPerformance = currentBalance - user.startingBalance;

  return {
    totalProfit,
    totalLoss,
    currentBalance,
    netPerformance,
    startingBalance: user.startingBalance,
  };
};