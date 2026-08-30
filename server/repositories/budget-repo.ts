import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function listBudgetsForMonth(userId: string, monthStart: Date) {
  return prisma.budget.findMany({
    where: {
      userId,
      monthStart,
    },
    include: {
      category: true,
    },
  });
}

export async function upsertBudget(input: {
  userId: string;
  monthStart: Date;
  amount: number;
  categoryId?: string | null;
}) {
  const existing = await prisma.budget.findFirst({
    where: {
      userId: input.userId,
      monthStart: input.monthStart,
      categoryId: input.categoryId ?? null,
    },
  });

  if (existing) {
    return prisma.budget.update({
      where: { id: existing.id },
      data: {
        amount: new Prisma.Decimal(input.amount.toFixed(2)),
      },
      include: {
        category: true,
      },
    });
  }

  return prisma.budget.create({
    data: {
      userId: input.userId,
      monthStart: input.monthStart,
      period: "MONTHLY",
      amount: new Prisma.Decimal(input.amount.toFixed(2)),
      categoryId: input.categoryId ?? null,
    },
    include: {
      category: true,
    },
  });
}

export async function deleteBudget(budgetId: string, userId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
  });

  if (!budget || budget.userId !== userId) {
    throw new Error("Budget not found or unauthorized");
  }

  return prisma.budget.delete({
    where: { id: budgetId },
  });
}
