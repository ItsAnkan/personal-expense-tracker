import { assertTransactionAccountRules } from "@/domain/accounting/rules";
import type { LedgerTransaction } from "@/domain/accounting/types";
import { validateTransactionInput } from "@/domain/transactions/validators";
import { listAccountsByUser } from "@/server/repositories/account-repo";
import { createTransaction } from "@/server/repositories/transaction-repo";
import { toLedgerAccounts } from "@/server/use-cases/shared";

export async function createTransactionUseCase(userId: string, rawInput: unknown) {
  const input = validateTransactionInput(rawInput);
  const accounts = toLedgerAccounts(await listAccountsByUser(userId));

  const synthetic: LedgerTransaction = {
    id: "create-preview",
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

  return createTransaction({
    userId,
    type: input.type,
    amount: Number(input.amount.toFixed(2)),
    occurredAt: input.occurredAt,
    fromAccountId: input.fromAccountId ?? null,
    toAccountId: input.toAccountId ?? null,
    categoryId: input.categoryId ?? null,
    merchant: input.merchant ?? null,
    notes: input.notes ?? null,
    status: "POSTED",
    source: "MANUAL",
    refundForTransactionId: input.refundForTransactionId ?? null,
  });
}
