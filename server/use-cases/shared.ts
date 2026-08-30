import type { Account, Transaction } from "@prisma/client";

import type { LedgerAccount, LedgerTransaction } from "@/domain/accounting/types";

export function toLedgerAccounts(accounts: Account[]): LedgerAccount[] {
  return accounts.map((account) => ({
    id: account.id,
    userId: account.userId,
    name: account.name,
    type: account.type,
    openingBalance: Number(account.openingBalance),
    currency: account.currency,
    isActive: account.isActive,
  }));
}

export function toLedgerTransactions(transactions: Transaction[]): LedgerTransaction[] {
  return transactions.map((transaction) => ({
    id: transaction.id,
    userId: transaction.userId,
    type: transaction.type,
    amount: Number(transaction.amount),
    occurredAt: transaction.occurredAt,
    fromAccountId: transaction.fromAccountId,
    toAccountId: transaction.toAccountId,
    categoryId: transaction.categoryId,
    status: transaction.status,
    refundForTransactionId: transaction.refundForTransactionId,
  }));
}
