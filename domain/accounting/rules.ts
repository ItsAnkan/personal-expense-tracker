import type { LedgerAccount, LedgerTransaction } from "@/domain/accounting/types";

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function normalizePostedTransactions(
  transactions: LedgerTransaction[],
): LedgerTransaction[] {
  return transactions
    .filter((transaction) => (transaction.status ?? "POSTED") === "POSTED")
    .map((transaction) => ({
      ...transaction,
      occurredAt: toDate(transaction.occurredAt),
    }))
    .sort(
      (left, right) =>
        (left.occurredAt as Date).getTime() - (right.occurredAt as Date).getTime(),
    );
}

export function assertTransactionAccountRules(
  transaction: LedgerTransaction,
  accountsById: Map<string, LedgerAccount>,
): void {
  const fromAccount = transaction.fromAccountId
    ? accountsById.get(transaction.fromAccountId)
    : undefined;
  const toAccount = transaction.toAccountId ? accountsById.get(transaction.toAccountId) : undefined;

  if (transaction.amount <= 0) {
    throw new Error(`Transaction "${transaction.id}" must have a positive amount.`);
  }

  switch (transaction.type) {
    case "EXPENSE": {
      if (!fromAccount) {
        throw new Error(`Expense "${transaction.id}" requires fromAccountId.`);
      }
      if (!transaction.categoryId) {
        throw new Error(`Expense "${transaction.id}" requires categoryId.`);
      }
      break;
    }
    case "INCOME": {
      if (!toAccount) {
        throw new Error(`Income "${transaction.id}" requires toAccountId.`);
      }
      if (toAccount.type === "CREDIT_CARD") {
        throw new Error(`Income "${transaction.id}" cannot target credit-card accounts.`);
      }
      break;
    }
    case "TRANSFER": {
      if (!fromAccount || !toAccount) {
        throw new Error(`Transfer "${transaction.id}" requires fromAccountId and toAccountId.`);
      }
      if (fromAccount.id === toAccount.id) {
        throw new Error(`Transfer "${transaction.id}" must use different accounts.`);
      }
      if (fromAccount.type === "CREDIT_CARD" || toAccount.type === "CREDIT_CARD") {
        throw new Error(
          `Transfer "${transaction.id}" cannot involve credit cards; use CREDIT_CARD_PAYMENT.`,
        );
      }
      break;
    }
    case "CREDIT_CARD_PAYMENT": {
      if (!fromAccount || !toAccount) {
        throw new Error(
          `Credit-card payment "${transaction.id}" requires fromAccountId and toAccountId.`,
        );
      }
      if (fromAccount.type === "CREDIT_CARD" || toAccount.type !== "CREDIT_CARD") {
        throw new Error(
          `Credit-card payment "${transaction.id}" must move from non-credit-card account to credit-card account.`,
        );
      }
      break;
    }
    case "REFUND": {
      if (!toAccount) {
        throw new Error(`Refund "${transaction.id}" requires toAccountId.`);
      }
      if (transaction.categoryId == null) {
        throw new Error(`Refund "${transaction.id}" requires categoryId for analytics.`);
      }
      break;
    }
    default: {
      const neverTransactionType: never = transaction.type;
      throw new Error(`Unsupported transaction type: ${neverTransactionType}`);
    }
  }
}
