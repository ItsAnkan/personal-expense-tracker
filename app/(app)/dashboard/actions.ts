"use server";

import { revalidatePath } from "next/cache";

import { requireUserSession } from "@/lib/auth/session";
import { monthBounds, parseMonthParam } from "@/lib/format";
import { deleteBudget, upsertBudget } from "@/server/repositories/budget-repo";

function readString(formData: FormData, field: string): string {
  const value = formData.get(field);
  if (typeof value !== "string") {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

function readAmount(formData: FormData, field: string): number {
  const raw = readString(formData, field);
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive number.`);
  }
  return value;
}

export async function upsertOverallBudgetAction(formData: FormData) {
  const session = await requireUserSession();
  const month = parseMonthParam(readString(formData, "month"));
  const amount = readAmount(formData, "amount");
  const { start } = monthBounds(month);

  await upsertBudget({
    userId: session.user.id,
    monthStart: start,
    amount,
    categoryId: null,
  });

  revalidatePath("/dashboard");
}

export async function upsertCategoryBudgetAction(formData: FormData) {
  const session = await requireUserSession();
  const month = parseMonthParam(readString(formData, "month"));
  const amount = readAmount(formData, "amount");
  const categoryId = readString(formData, "categoryId");
  const { start } = monthBounds(month);

  await upsertBudget({
    userId: session.user.id,
    monthStart: start,
    amount,
    categoryId,
  });

  revalidatePath("/dashboard");
}

export async function deleteOverallBudgetAction(formData: FormData) {
  const session = await requireUserSession();
  const budgetId = readString(formData, "budgetId");

  await deleteBudget(budgetId, session.user.id);

  revalidatePath("/dashboard");
}

export async function deleteCategoryBudgetAction(formData: FormData) {
  const session = await requireUserSession();
  const budgetId = readString(formData, "budgetId");

  await deleteBudget(budgetId, session.user.id);

  revalidatePath("/dashboard");
}
