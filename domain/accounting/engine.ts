import type { LedgerAccount, LedgerTransaction, MonthRef, MonthlySnapshot } from "@/domain/accounting/types";
import {
  calculateAccountBalances,
  calculateBudgetStatus,
  calculateCategorySpending,
  calculateMonthlyComparison,
  calculateMonthlyExpenses,
  calculateMonthlyIncome,
  calculateNetCashFlow,
} from "@/domain/accounting/calculators";

export function createAccountingEngine(accounts: LedgerAccount[], transactions: LedgerTransaction[]) {
  return {
    calculateAccountBalanceSummary: () => calculateAccountBalances(accounts, transactions),
    calculateMonthlyIncome: (month: MonthRef) => calculateMonthlyIncome(transactions, month),
    calculateMonthlyExpenses: (month: MonthRef) => calculateMonthlyExpenses(transactions, month),
    calculateNetCashFlow: (month: MonthRef) => calculateNetCashFlow(transactions, month),
    calculateCategorySpending: (month: MonthRef) => calculateCategorySpending(transactions, month),
    calculateBudgetStatus,
    calculateMonthlyComparison: (months: MonthRef[]): MonthlySnapshot[] =>
      calculateMonthlyComparison(transactions, months),
  };
}
