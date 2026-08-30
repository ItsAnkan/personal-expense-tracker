import { z } from "zod";

export const transactionInputSchema = z
  .object({
    type: z.enum(["EXPENSE", "INCOME", "TRANSFER", "CREDIT_CARD_PAYMENT", "REFUND"]),
    amount: z.number().positive(),
    occurredAt: z.coerce.date(),
    fromAccountId: z.string().min(1).nullable().optional(),
    toAccountId: z.string().min(1).nullable().optional(),
    categoryId: z.string().min(1).nullable().optional(),
    merchant: z.string().trim().max(120).nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    refundForTransactionId: z.string().min(1).nullable().optional(),
  })
  .superRefine((value, context) => {
    switch (value.type) {
      case "EXPENSE":
        if (!value.fromAccountId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Expense requires fromAccountId.",
            path: ["fromAccountId"],
          });
        }
        if (!value.categoryId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Expense requires categoryId.",
            path: ["categoryId"],
          });
        }
        break;
      case "INCOME":
        if (!value.toAccountId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Income requires toAccountId.",
            path: ["toAccountId"],
          });
        }
        break;
      case "TRANSFER":
        if (!value.fromAccountId || !value.toAccountId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Transfer requires fromAccountId and toAccountId.",
          });
        } else if (value.fromAccountId === value.toAccountId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Transfer source and destination must be different.",
          });
        }
        break;
      case "CREDIT_CARD_PAYMENT":
        if (!value.fromAccountId || !value.toAccountId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Credit-card payment requires fromAccountId and toAccountId.",
          });
        }
        break;
      case "REFUND":
        if (!value.toAccountId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Refund requires toAccountId.",
            path: ["toAccountId"],
          });
        }
        if (!value.categoryId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Refund requires categoryId.",
            path: ["categoryId"],
          });
        }
        break;
      default:
        break;
    }
  });

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export function validateTransactionInput(input: unknown): TransactionInput {
  return transactionInputSchema.parse(input);
}
