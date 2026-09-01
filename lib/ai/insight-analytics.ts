import type { getDashboardData } from "@/server/use-cases/get-dashboard";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export type InsightObservationSeverity = "neutral" | "positive" | "attention";

export interface InsightObservation {
  title: string;
  description: string;
  severity: InsightObservationSeverity;
}

export interface InsightAIResponse {
  summary: string;
  observations: InsightObservation[];
}

export interface InsightAnalytics {
  period: string;
  comparisonPeriod: string | null;
  financialPosition: {
    assets: number;
    liabilities: number;
    netPosition: number;
    change: number | null;
  };
  income: {
    total: number;
    previousPeriod: number | null;
    changePercent: number | null;
  };
  creditCards: {
    outstanding: number;
    previousOutstanding: number | null;
    change: number | null;
  };
  transactionActivity: {
    count: number;
    averageAmount: number;
    largestAmount: number;
  };
  categoryFocus: {
    name: string | null;
    amount: number;
    shareOfSpend: number;
    changePercent: number | null;
  };
  accountHealth: {
    totalAccounts: number;
    hasPositiveCashBuffer: boolean;
  };
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

export function buildInsightAnalytics(
  currentData: DashboardData,
  previousData: DashboardData | null,
  currentTransactions: Array<{ amount: number; type: string }>,
  previousTransactions: Array<{ amount: number; type: string }>,
): InsightAnalytics {
  const topCategory = currentData.categorySpending
    .slice()
    .sort((left, right) => right.amount - left.amount)[0] ?? null;

  const spend = currentData.expenses;
  const spendShare = topCategory && spend > 0 ? (topCategory.amount / spend) * 100 : 0;

  const previousNetPosition = previousData
    ? previousData.totalAccountBalance - previousData.totalCreditCardOutstanding
    : null;
  const currentNetPosition = currentData.totalAccountBalance - currentData.totalCreditCardOutstanding;
  const netPositionChange = previousNetPosition !== null ? currentNetPosition - previousNetPosition : null;

  const previousIncome = previousData ? previousData.income : null;
  const incomeChangePercent = previousIncome && previousIncome !== 0
    ? ((currentData.income - previousIncome) / previousIncome) * 100
    : null;

  const previousOutstanding = previousData ? previousData.totalCreditCardOutstanding : null;
  const creditChange = previousOutstanding !== null ? currentData.totalCreditCardOutstanding - previousOutstanding : null;

  const currentCount = currentTransactions.length;
  const totalCurrentValue = currentTransactions.reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);
  const largestAmount = currentTransactions.reduce(
    (largest, item) => Math.max(largest, Math.abs(Number(item.amount))),
    0,
  );

  const previousLargest = previousTransactions.reduce(
    (largest, item) => Math.max(largest, Math.abs(Number(item.amount))),
    0,
  );

  const previousSpendPeak = previousData && previousData.categorySpending.length > 0
    ? previousData.categorySpending.reduce((largest, item) => Math.max(largest, item.amount), 0)
    : null;
  const categoryChangePercent = topCategory && previousSpendPeak !== null
    ? percentChange(topCategory.amount, previousSpendPeak)
    : null;

  return {
    period: currentData.month.month.toString(),
    comparisonPeriod: previousData ? previousData.month.month.toString() : null,
    financialPosition: {
      assets: currentData.totalAccountBalance,
      liabilities: currentData.totalCreditCardOutstanding,
      netPosition: currentNetPosition,
      change: netPositionChange,
    },
    income: {
      total: currentData.income,
      previousPeriod: previousIncome,
      changePercent: incomeChangePercent,
    },
    creditCards: {
      outstanding: currentData.totalCreditCardOutstanding,
      previousOutstanding,
      change: creditChange,
    },
    transactionActivity: {
      count: currentCount,
      averageAmount: currentCount > 0 ? totalCurrentValue / currentCount : 0,
      largestAmount: Math.max(largestAmount, previousLargest),
    },
    categoryFocus: {
      name: topCategory?.name ?? null,
      amount: topCategory?.amount ?? 0,
      shareOfSpend: spendShare,
      changePercent: categoryChangePercent,
    },
    accountHealth: {
      totalAccounts: currentData.totalAccountBalance > 0 ? 1 : 0,
      hasPositiveCashBuffer: currentData.netCashFlow > 0,
    },
  };
}
