import { deleteTransaction, getTransactionById } from "@/server/repositories/transaction-repo";

export async function deleteTransactionUseCase(userId: string, transactionId: string) {
  const existing = await getTransactionById(userId, transactionId);
  if (!existing) {
    throw new Error("Transaction not found.");
  }
  return deleteTransaction(existing.id);
}
