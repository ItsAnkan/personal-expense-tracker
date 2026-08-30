"use server";

import { revalidatePath } from "next/cache";

import { requireUserSession } from "@/lib/auth/session";
import {
  createCategory,
  deleteCategory,
  listCategoriesByUser,
  swapCategoryOrder,
  updateCategory,
} from "@/server/repositories/category-repo";

function mustString(value: FormDataEntryValue | null, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

export async function createCategoryAction(formData: FormData) {
  const session = await requireUserSession();
  const name = mustString(formData.get("name"), "Category name");
  const parentId = typeof formData.get("parentId") === "string" ? String(formData.get("parentId")).trim() : "";
  await createCategory({
    userId: session.user.id,
    name,
    parentId: parentId.length > 0 ? parentId : null,
  });
  revalidatePath("/categories");
}

export async function updateCategoryAction(formData: FormData) {
  const session = await requireUserSession();
  const id = mustString(formData.get("id"), "Category id");
  const name = mustString(formData.get("name"), "Category name");
  await updateCategory({ userId: session.user.id, id, name });
  revalidatePath("/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const session = await requireUserSession();
  const id = mustString(formData.get("id"), "Category id");
  await deleteCategory(session.user.id, id);
  revalidatePath("/categories");
}

export async function moveCategoryAction(formData: FormData) {
  const session = await requireUserSession();
  const id = mustString(formData.get("id"), "Category id");
  const direction = mustString(formData.get("direction"), "Direction");

  const categories = await listCategoriesByUser(session.user.id);
  const current = categories.find((category) => category.id === id);
  if (!current) {
    throw new Error("Category not found.");
  }

  const siblings = categories
    .filter((category) => category.parentId === current.parentId)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const currentIndex = siblings.findIndex((category) => category.id === id);
  if (currentIndex === -1) {
    throw new Error("Category ordering data not found.");
  }

  const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) {
    return;
  }

  await swapCategoryOrder(session.user.id, siblings[currentIndex].id, siblings[swapIndex].id);
  revalidatePath("/categories");
}
