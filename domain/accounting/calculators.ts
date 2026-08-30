import type {
  AccountComputation,
  AccountingSummary,
  BudgetStatus,
  LedgerAccount,
  LedgerTransaction,
  MonthRef,
  MonthlySnapshot,
} from "@/domain/accounting/types";
import { assertTransactionAccountRules, normalizePostedTransactions } from "@/domain/accounting/rules";

function monthBounds(month: MonthRef): { start: Date; end: Date } {
  const start = new Date(Date.UTC(month.year, month.month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(month.year, month.month, 1, 0, 0, 0, 0));
  return { start, end };
}

function inMonth(dateValue: Date | string, month: MonthRef): boolean {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const { start, end } = monthBounds(month);
  const time = date.getTime();
  return time >= start.getTime() && time < end.getTime();
}

function toComputationMap(accounts: LedgerAccount[]): Record<string, AccountComputation> {
  return Object.fromEntries(
    accounts.map((account) => [
      account.id,
      {
        accountId: account.id,
        accountType: account.type,
        openingBalance: account.openingBalance,
        currentBalance: account.openingBalance,
        moneyIn: 0,
        moneyOut: 0,
      } satisfies AccountComputation,
    ]),
  );
}

export function calculateAccountBalances(
  accounts: LedgerAccount[],
  transactions: LedgerTransaction[],
): AccountingSummary {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const computations = toComputationMap(accounts);

  for (const transaction of normalizePostedTransactions(transactions)) {
    assertTransactionAccountRules(transaction, accountsById);

    const amount = transaction.amount;
    const from = transaction.fromAccountId ? computations[transaction.fromAccountId] : undefined;
    const to = transaction.toAccountId ? computations[transaction.toAccountId] : undefined;
    const fromType = from ? accountsById.get(from.accountId)?.type : undefined;
    const toType = to ? accountsById.get(to.accountId)?.type : undefined;

    switch (transaction.type) {
      case "EXPENSE":
        if (!from) {
          throw new Error(`Missing from account for expense "${transaction.id}".`);
        }
        from.moneyOut += amount;
        if (fromType === "CREDIT_CARD") {
          from.currentBalance += amount;
        } else {
          from.currentBalance -= amount;
        }
        break;
      case "INCOME":
        if (!to) {
          throw new Error(`Missing to account for income "${transaction.id}".`);
        }
        to.moneyIn += amount;
        to.currentBalance += amount;
        break;
      case "TRANSFER":
        if (!from || !to) {
          throw new Error(`Missing accounts for transfer "${transaction.id}".`);
        }
        from.moneyOut += amount;
        to.moneyIn += amount;
        from.currentBalance -= amount;
        to.currentBalance += amount;
        break;
      case "CREDIT_CARD_PAYMENT":
        if (!from || !to) {
          throw new Error(`Missing accounts for credit-card payment "${transaction.id}".`);
        }
        from.moneyOut += amount;
        to.moneyIn += amount;
        from.currentBalance -= amount;
        if (toType !== "CREDIT_CARD") {
          throw new Error(`Credit-card payment "${transaction.id}" target must be credit-card.`);
        }
        to.currentBalance -= amount;
        break;
      case "REFUND":
        if (!to) {
          throw new Error(`Missing to account for refund "${transaction.id}".`);
        }
        to.moneyIn += amount;
        if (toType === "CREDIT_CARD") {
          to.currentBalance -= amount;
        } else {
          to.currentBalance += amount;
        }
        break;
      default: {
        const neverType: never = transaction.type;
        throw new Error(`Unsupported transaction type: ${neverType}`);
      }
    }
  }

  let totalAccountBalance = 0;
  let totalCreditCardOutstanding = 0;

  Object.values(computations).forEach((entry) => {
    if (entry.accountType === "CREDIT_CARD") {
      totalCreditCardOutstanding += entry.currentBalance;
      return;
    }
    totalAccountBalance += entry.currentBalance;
  });

  return {
    balances: computations,
    totalAccountBalance,
    totalCreditCardOutstanding,
  };
}

export function calculateMonthlyIncome(
  transactions: LedgerTransaction[],
  month: MonthRef,
): number {
  return normalizePostedTransactions(transactions)
    .filter((transaction) => transaction.type === "INCOME" && inMonth(transaction.occurredAt, month))
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function calculateMonthlyExpenses(
  transactions: LedgerTransaction[],
  month: MonthRef,
): number {
  const relevant = normalizePostedTransactions(transactions).filter((transaction) =>
    inMonth(transaction.occurredAt, month),
  );

  const grossExpenses = relevant
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const refunds = relevant
    .filter((transaction) => transaction.type === "REFUND")
    .reduce((total, transaction) => total + transaction.amount, 0);

  return grossExpenses - refunds;
}

export function calculateNetCashFlow(
  transactions: LedgerTransaction[],
  month: MonthRef,
): number {
  return calculateMonthlyIncome(transactions, month) - calculateMonthlyExpenses(transactions, month);
}

export function calculateCategorySpending(
  transactions: LedgerTransaction[],
  month: MonthRef,
): Record<string, number> {
  const spendingByCategory: Record<string, number> = {};

  for (const transaction of normalizePostedTransactions(transactions)) {
    if (!inMonth(transaction.occurredAt, month) || !transaction.categoryId) {
      continue;
    }

    if (transaction.type === "EXPENSE") {
      spendingByCategory[transaction.categoryId] =
        (spendingByCategory[transaction.categoryId] ?? 0) + transaction.amount;
      continue;
    }

    if (transaction.type === "REFUND") {
      spendingByCategory[transaction.categoryId] =
        (spendingByCategory[transaction.categoryId] ?? 0) - transaction.amount;
    }
  }

  return spendingByCategory;
}

export function calculateBudgetStatus(budget: number, spent: number): BudgetStatus {
  if (budget <= 0) {
    throw new Error("Budget must be greater than zero.");
  }

  const remaining = budget - spent;
  const utilizationPercent = (spent / budget) * 100;

  return {
    budget,
    spent,
    remaining,
    utilizationPercent,
    isNearLimit: utilizationPercent >= 80 && utilizationPercent <= 100,
    isOverBudget: spent > budget,
  };
}

export function calculateMonthlyComparison(
  transactions: LedgerTransaction[],
  months: MonthRef[],
): MonthlySnapshot[] {
  return months.map((month) => {
    const income = calculateMonthlyIncome(transactions, month);
    const expenses = calculateMonthlyExpenses(transactions, month);

    return {
      month,
      income,
      expenses,
      netCashFlow: income - expenses,
    };
  });
}
