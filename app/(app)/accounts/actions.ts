"use server";

import { AccountType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireUserSession } from "@/lib/auth/session";
import { createAccount } from "@/server/repositories/account-repo";

const accountTypes = ["BANK_ACCOUNT", "CASH", "CREDIT_CARD", "WALLET", "OTHER"] as const;

export async function createAccountAction(formData: FormData) {
  const session = await requireUserSession();

  const name = String(formData.get("name") ?? "").trim();
  const typeValue = String(formData.get("type") ?? "").trim();
  const openingBalanceValue = String(formData.get("openingBalance") ?? "").trim();
  const currency = String(formData.get("currency") ?? "INR").trim() || "INR";
  const notesInput = String(formData.get("notes") ?? "").trim();

  if (name.length === 0) {
    throw new Error("Account name is required.");
  }
  if (!accountTypes.includes(typeValue as (typeof accountTypes)[number])) {
    throw new Error("Account type is invalid.");
  }

  const openingBalance = Number(openingBalanceValue);
  if (!Number.isFinite(openingBalance)) {
    throw new Error("Opening balance must be a valid number.");
  }

  await createAccount({
    userId: session.user.id,
    name,
    type: typeValue as AccountType,
    openingBalance: Number(openingBalance.toFixed(2)),
    currency,
    notes: notesInput.length > 0 ? notesInput : null,
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}
