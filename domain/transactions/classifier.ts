import type { TransactionInput } from "@/domain/transactions/validators";

type ClassificationSuggestion = {
  type: TransactionInput["type"];
  confidence: "high" | "medium" | "low";
  reason: string;
};

export function classifyTransaction(input: TransactionInput): ClassificationSuggestion {
  if (input.type === "CREDIT_CARD_PAYMENT") {
    return {
      type: "CREDIT_CARD_PAYMENT",
      confidence: "high",
      reason: "Explicit payment flow from asset account to credit card.",
    };
  }

  if (input.type === "TRANSFER") {
    return {
      type: "TRANSFER",
      confidence: "high",
      reason: "Money movement between own accounts with no expense category.",
    };
  }

  if (input.type === "REFUND") {
    return {
      type: "REFUND",
      confidence: "high",
      reason: "Inbound reversal intended to reduce prior spending.",
    };
  }

  if (input.type === "INCOME") {
    return {
      type: "INCOME",
      confidence: "high",
      reason: "Inbound non-reversal amount.",
    };
  }

  return {
    type: "EXPENSE",
    confidence: "high",
    reason: "Default spending transaction classification.",
  };
}
