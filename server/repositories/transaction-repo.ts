import type { Prisma, TransactionType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export interface TransactionListFilters {
  monthStart?: Date;
  monthEnd?: Date;
  categoryId?: string;
  accountId?: string;
  type?: TransactionType;
  query?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: "occurredAt" | "amount";
  sortDirection?: "asc" | "desc";
}

export async function listTransactionsByUser(userId: string, filters: TransactionListFilters = {}) {
  const where: Prisma.TransactionWhereInput = {
    userId,
    status: "POSTED",
  };

  if (filters.monthStart && filters.monthEnd) {
    where.occurredAt = {
      gte: filters.monthStart,
      lt: filters.monthEnd,
    };
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.accountId) {
    where.OR = [{ fromAccountId: filters.accountId }, { toAccountId: filters.accountId }];
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.query) {
    const query = filters.query.trim();
    if (query.length > 0) {
      where.AND = [
        ...((where.AND as Prisma.TransactionWhereInput[] | undefined) ?? []),
        {
          OR: [
            { notes: { contains: query, mode: "insensitive" } },
            { merchant: { contains: query, mode: "insensitive" } },
            { category: { name: { contains: query, mode: "insensitive" } } },
            { fromAccount: { name: { contains: query, mode: "insensitive" } } },
            { toAccount: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
      ];
    }
  }

  if (typeof filters.minAmount === "number" || typeof filters.maxAmount === "number") {
    where.amount = {
      ...(typeof filters.minAmount === "number" ? { gte: filters.minAmount } : {}),
      ...(typeof filters.maxAmount === "number" ? { lte: filters.maxAmount } : {}),
    };
  }

  const sortBy = filters.sortBy ?? "occurredAt";
  const sortDirection = filters.sortDirection ?? "desc";

  return prisma.transaction.findMany({
    where,
    include: {
      fromAccount: true,
      toAccount: true,
      category: true,
    },
    orderBy: [{ [sortBy]: sortDirection }, { createdAt: "desc" }],
  });
}

export async function listTransactionsInRange(userId: string, untilExclusive?: Date) {
  return prisma.transaction.findMany({
    where: {
      userId,
      status: "POSTED",
      ...(untilExclusive ? { occurredAt: { lt: untilExclusive } } : {}),
    },
    orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
  });
}

export async function getTransactionById(userId: string, id: string) {
  return prisma.transaction.findFirst({
    where: { userId, id, status: "POSTED" },
  });
}

export async function createTransaction(data: Prisma.TransactionUncheckedCreateInput) {
  return prisma.transaction.create({ data });
}

export async function updateTransaction(id: string, data: Prisma.TransactionUncheckedUpdateInput) {
  return prisma.transaction.update({
    where: { id },
    data,
  });
}

export async function deleteTransaction(id: string) {
  return prisma.transaction.delete({
    where: { id },
  });
}
