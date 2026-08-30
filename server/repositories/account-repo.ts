import { AccountType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function listAccountsByUser(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getAccountById(userId: string, accountId: string) {
  return prisma.account.findFirst({
    where: { id: accountId, userId },
  });
}

export async function createAccount(input: {
  userId: string;
  name: string;
  type: AccountType;
  openingBalance: Prisma.Decimal;
  currency: string;
  notes?: string | null;
}) {
  const maxSortOrder = await prisma.account.aggregate({
    where: { userId: input.userId },
    _max: { sortOrder: true },
  });

  return prisma.account.create({
    data: {
      ...input,
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
    },
  });
}
