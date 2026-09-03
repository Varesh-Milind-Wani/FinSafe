import * as XLSX from "xlsx";
import type { UserAccount } from "../types/finance";

export const exportFinanceToExcel = (user: UserAccount) => {
  const totalProfit = user.transactions
    .filter((transaction) => transaction.type === "profit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalLoss = user.transactions
    .filter((transaction) => transaction.type === "loss")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const currentBalance =
    user.startingBalance + totalProfit - totalLoss;

  const netPerformance = totalProfit - totalLoss;

  const summaryData = [
    ["FINTRACK - FINANCE REPORT"],
    [],
    ["Account Information"],
    ["Name", user.name],
    ["Email", user.email],
    ["Created", new Date(user.createdAt).toLocaleString()],
    [],
    ["Financial Summary"],
    ["Starting Balance", user.startingBalance],
    ["Total Profit", totalProfit],
    ["Total Loss", totalLoss],
    ["Current Balance", currentBalance],
    ["Net Performance", netPerformance],
    [],
    ["Exported At", new Date().toLocaleString()],
  ];

  const transactionData = user.transactions.map((transaction) => ({
    "Transaction ID": transaction.id,
    Date: new Date(transaction.date).toLocaleDateString("en-IN"),
    Time: new Date(transaction.date).toLocaleTimeString("en-IN"),
    Type: transaction.type === "profit" ? "Profit" : "Loss",
    Category: transaction.category,
    Note: transaction.note || "-",
    Price: transaction.price || 0,
    "Trades": transaction.type === "profit" ? (transaction.profitTradeCount || 0) : (transaction.lossTradeCount || 0),
    "Gross Amount": transaction.grossAmount || 0,
    "Cost Amount": transaction.costAmount || 0,
    "Net Amount": transaction.amount,
    "Signed Amount":
      transaction.type === "profit"
        ? transaction.amount
        : -transaction.amount,
  }));

  const workbook = XLSX.utils.book_new();

  const summarySheet =
    XLSX.utils.aoa_to_sheet(summaryData);

  const transactionSheet =
    XLSX.utils.json_to_sheet(transactionData);

  summarySheet["!cols"] = [
    { wch: 25 },
    { wch: 35 },
  ];

  transactionSheet["!cols"] = [
    { wch: 38 },
    { wch: 15 },
    { wch: 13 },
    { wch: 12 },
    { wch: 18 },
    { wch: 35 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    "Summary"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    transactionSheet,
    "Transactions"
  );

  const safeName =
    user.name
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase() || "user";

  const fileName =
    `FinTrack-${safeName}-${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};
