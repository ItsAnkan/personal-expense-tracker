import { Prisma } from "@prisma/client";

import { assertTransactionAccountRules } from "@/domain/accounting/rules";
import type { LedgerTransaction } from "@/domain/accounting/types";
import { validateTransactionInput } from "@/domain/transactions/validators";
import { listAccountsByUser } from "@/server/repositories/account-repo";
import { getTransactionById, updateTransaction } from "@/server/repositories/transaction-repo";
import { toLedgerAccounts } from "@/server/use-cases/shared";

export async function updateTransactionUseCase(
  userId: string,
  transactionId: string,
  rawInput: unknown,
) {
  const existing = await getTransactionById(userId, transactionId);
  if (!existing) {
    throw new Error("Transaction not found.");
  }

  const input = validateTransactionInput(rawInput);
  const accounts = toLedgerAccounts(await listAccountsByUser(userId));

  const synthetic: LedgerTransaction = {
    id: existing.id,
    userId,
    type: input.type,
    amount: input.amount,
    occurredAt: input.occurredAt,
    fromAccountId: input.fromAccountId ?? null,
    toAccountId: input.toAccountId ?? null,
    categoryId: input.categoryId ?? null,
    status: "POSTED",
    refundForTransactionId: input.refundForTransactionId ?? null,
  };

  assertTransactionAccountRules(synthetic, new Map(accounts.map((account) => [account.id, account])));

  return updateTransaction(existing.id, {
    type: input.type,
    amount: new Prisma.Decimal(input.amount.toFixed(2)),
    occurredAt: input.occurredAt,
    fromAccountId: input.fromAccountId ?? null,
    toAccountId: input.toAccountId ?? null,
    categoryId: input.categoryId ?? null,
    merchant: input.merchant ?? null,
    notes: input.notes ?? null,
    refundForTransactionId: input.refundForTransactionId ?? null,
  });
}
