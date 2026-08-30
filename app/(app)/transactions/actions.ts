"use server";

import { revalidatePath } from "next/cache";

import { requireUserSession } from "@/lib/auth/session";
import { createTransactionUseCase } from "@/server/use-cases/create-transaction";
import { deleteTransactionUseCase } from "@/server/use-cases/delete-transaction";
import { updateTransactionUseCase } from "@/server/use-cases/update-transaction";

function parseNullableText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseRequiredNumber(value: FormDataEntryValue | null, fieldName: string): number {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
  return parsed;
}

function parseRequiredDate(value: FormDataEntryValue | null): Date {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Date is required.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Date is invalid.");
  }
  return date;
}

function toTransactionInput(formData: FormData) {
  const type = parseNullableText(formData.get("type"));
  if (!type) {
    throw new Error("Transaction type is required.");
  }

  return {
    type,
    amount: parseRequiredNumber(formData.get("amount"), "Amount"),
    occurredAt: parseRequiredDate(formData.get("occurredAt")),
    fromAccountId: parseNullableText(formData.get("fromAccountId")),
    toAccountId: parseNullableText(formData.get("toAccountId")),
    categoryId: parseNullableText(formData.get("categoryId")),
    merchant: parseNullableText(formData.get("merchant")),
    notes: parseNullableText(formData.get("notes")),
    refundForTransactionId: parseNullableText(formData.get("refundForTransactionId")),
  };
}

export async function createTransactionAction(formData: FormData) {
  const session = await requireUserSession();
  await createTransactionUseCase(session.user.id, toTransactionInput(formData));
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/monthly-history");
}

export async function updateTransactionAction(formData: FormData) {
  const session = await requireUserSession();
  const transactionId = parseNullableText(formData.get("transactionId"));
  if (!transactionId) {
    throw new Error("transactionId is required.");
  }

  await updateTransactionUseCase(session.user.id, transactionId, toTransactionInput(formData));
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/monthly-history");
}

export async function deleteTransactionAction(formData: FormData) {
  const session = await requireUserSession();
  const transactionId = parseNullableText(formData.get("transactionId"));
  if (!transactionId) {
    throw new Error("transactionId is required.");
  }

  await deleteTransactionUseCase(session.user.id, transactionId);
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/monthly-history");
}
