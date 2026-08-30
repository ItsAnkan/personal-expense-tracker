import { createAccountingEngine } from "@/domain/accounting/engine";
import type { MonthRef } from "@/domain/accounting/types";
import { listAccountsByUser } from "@/server/repositories/account-repo";
import { listTransactionsInRange } from "@/server/repositories/transaction-repo";
import { toLedgerAccounts, toLedgerTransactions } from "@/server/use-cases/shared";

export async function getMonthlyHistoryData(
  userId: string,
  months: MonthRef[],
): Promise<Array<{ month: MonthRef; income: number; expenses: number; netCashFlow: number }>> {
  const [accounts, transactions] = await Promise.all([
    listAccountsByUser(userId),
    listTransactionsInRange(userId),
  ]);

  const engine = createAccountingEngine(
    toLedgerAccounts(accounts),
    toLedgerTransactions(transactions),
  );

  return engine.calculateMonthlyComparison(months);
}
