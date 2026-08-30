import { createAccountingEngine } from "@/domain/accounting/engine";
import type { MonthRef } from "@/domain/accounting/types";
import { monthBounds } from "@/lib/format";
import { listAccountsByUser } from "@/server/repositories/account-repo";
import { listBudgetsForMonth } from "@/server/repositories/budget-repo";
import { listCategoriesByUser } from "@/server/repositories/category-repo";
import { listTransactionsByUser, listTransactionsInRange } from "@/server/repositories/transaction-repo";
import { toLedgerAccounts, toLedgerTransactions } from "@/server/use-cases/shared";

export async function getDashboardData(userId: string, month: MonthRef) {
  const { start, end } = monthBounds(month);
  const [accounts, categories, budgets, currentMonthTransactions, allTransactionsUntilMonthEnd] = await Promise.all([
    listAccountsByUser(userId),
    listCategoriesByUser(userId),
    listBudgetsForMonth(userId, start),
    listTransactionsByUser(userId, { monthStart: start, monthEnd: end }),
    listTransactionsInRange(userId, end),
  ]);

  const ledgerAccounts = toLedgerAccounts(accounts);
  const monthLedgerTransactions = toLedgerTransactions(currentMonthTransactions);
  const toDateLedgerTransactions = toLedgerTransactions(allTransactionsUntilMonthEnd);

  const monthEngine = createAccountingEngine(ledgerAccounts, monthLedgerTransactions);
  const overallEngine = createAccountingEngine(ledgerAccounts, toDateLedgerTransactions);
  const accountSummary = overallEngine.calculateAccountBalanceSummary();

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const categorySpending = monthEngine.calculateCategorySpending(month);
  const monthlyComparisonMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(month.year, month.month - 1 - index, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  }).reverse();
  const monthlyComparison = createAccountingEngine(
    ledgerAccounts,
    toDateLedgerTransactions,
  ).calculateMonthlyComparison(monthlyComparisonMonths);

  const dailySpendingMap = new Map<string, number>();
  for (const transaction of monthLedgerTransactions) {
    const occurredAt = transaction.occurredAt instanceof Date
      ? transaction.occurredAt
      : new Date(transaction.occurredAt);
    const dayKey = occurredAt.toISOString().slice(0, 10);
    const current = dailySpendingMap.get(dayKey) ?? 0;

    if (transaction.type === "EXPENSE") {
      dailySpendingMap.set(dayKey, current + transaction.amount);
    } else if (transaction.type === "REFUND") {
      dailySpendingMap.set(dayKey, current - transaction.amount);
    }
  }

  const dailySpending = Array.from(dailySpendingMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((left, right) => left.date.localeCompare(right.date));

  const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];
  const trendCategoryId = topCategory?.[0] ?? null;
  const categoryTrend = monthlyComparisonMonths.map((monthItem) => {
    const monthStart = new Date(Date.UTC(monthItem.year, monthItem.month - 1, 1, 0, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(monthItem.year, monthItem.month, 1, 0, 0, 0, 0));
    const monthTransactions = toDateLedgerTransactions.filter((transaction) => {
      const occurredAt = transaction.occurredAt instanceof Date
        ? transaction.occurredAt
        : new Date(transaction.occurredAt);
      const time = occurredAt.getTime();
      return time >= monthStart.getTime() && time < monthEnd.getTime();
    });

    let amount = 0;
    for (const transaction of monthTransactions) {
      if (!trendCategoryId || transaction.categoryId !== trendCategoryId) {
        continue;
      }
      if (transaction.type === "EXPENSE") {
        amount += transaction.amount;
      } else if (transaction.type === "REFUND") {
        amount -= transaction.amount;
      }
    }
    return { ...monthItem, amount };
  });

  const overallBudget = budgets.find((budget) => budget.categoryId === null);
  const overallBudgetStatus = overallBudget
    ? monthEngine.calculateBudgetStatus(Number(overallBudget.amount), monthEngine.calculateMonthlyExpenses(month))
    : null;

  const categoryBudgetStatuses = budgets
    .filter((budget) => budget.categoryId)
    .map((budget) => {
      const spent = categorySpending[budget.categoryId!] ?? 0;
      const status = monthEngine.calculateBudgetStatus(Number(budget.amount), spent);
      return {
        budgetId: budget.id,
        categoryId: budget.categoryId!,
        categoryName: budget.category?.name ?? budget.categoryId!,
        ...status,
      };
    })
    .sort((left, right) => right.utilizationPercent - left.utilizationPercent);

  return {
    month,
    income: monthEngine.calculateMonthlyIncome(month),
    expenses: monthEngine.calculateMonthlyExpenses(month),
    netCashFlow: monthEngine.calculateNetCashFlow(month),
    totalAccountBalance: accountSummary.totalAccountBalance,
    totalCreditCardOutstanding: accountSummary.totalCreditCardOutstanding,
    categorySpending: Object.entries(categorySpending).map(([categoryId, amount]) => ({
      categoryId,
      name: categoryNameById.get(categoryId) ?? categoryId,
      amount,
    })),
    dailySpending,
    monthlyComparison,
    categoryTrend: trendCategoryId
      ? {
          categoryId: trendCategoryId,
          categoryName: categoryNameById.get(trendCategoryId) ?? trendCategoryId,
          points: categoryTrend,
        }
      : null,
    overallBudgetId: overallBudget?.id ?? null,
    overallBudgetStatus,
    overallBudgetAmount: overallBudget ? Number(overallBudget.amount) : null,
    categoryBudgetStatuses,
  };
}
