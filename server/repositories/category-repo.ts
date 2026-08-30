import { prisma } from "@/lib/db/prisma";

export async function listCategoriesByUser(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getCategoryById(userId: string, categoryId: string) {
  return prisma.category.findFirst({
    where: { userId, id: categoryId },
  });
}

export async function createCategory(input: {
  userId: string;
  name: string;
  parentId?: string | null;
  kind?: "EXPENSE" | "INCOME" | "BOTH";
}) {
  const maxSortOrder = await prisma.category.aggregate({
    where: { userId: input.userId, parentId: input.parentId ?? null },
    _max: { sortOrder: true },
  });

  return prisma.category.create({
    data: {
      userId: input.userId,
      name: input.name,
      parentId: input.parentId ?? null,
      kind: input.kind ?? "EXPENSE",
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
    },
  });
}

export async function updateCategory(input: { userId: string; id: string; name: string }) {
  const existing = await prisma.category.findFirst({
    where: { id: input.id, userId: input.userId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("Category not found.");
  }

  return prisma.category.update({
    where: { id: input.id },
    data: { name: input.name },
  });
}

export async function deleteCategory(userId: string, id: string) {
  const existing = await prisma.category.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("Category not found.");
  }

  return prisma.category.delete({
    where: { id },
  });
}

export async function swapCategoryOrder(userId: string, firstId: string, secondId: string) {
  const categories = await prisma.category.findMany({
    where: { userId, id: { in: [firstId, secondId] } },
    select: { id: true, sortOrder: true },
  });

  if (categories.length !== 2) {
    throw new Error("Unable to reorder category: missing categories.");
  }

  const first = categories.find((category) => category.id === firstId);
  const second = categories.find((category) => category.id === secondId);
  if (!first || !second) {
    throw new Error("Unable to reorder category ordering data.");
  }

  await prisma.$transaction([
    prisma.category.update({
      where: { id: first.id },
      data: { sortOrder: second.sortOrder },
    }),
    prisma.category.update({
      where: { id: second.id },
      data: { sortOrder: first.sortOrder },
    }),
  ]);
}
