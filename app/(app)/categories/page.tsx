import {
  createCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
  updateCategoryAction,
} from "@/app/(app)/categories/actions";
import { CategoryChip } from "@/components/ui/category-chip";
import { requireUserSession } from "@/lib/auth/session";
import { listCategoriesByUser } from "@/server/repositories/category-repo";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await requireUserSession();
  const categories = await listCategoriesByUser(session.user.id);

  const categoriesByParent = new Map<string | null, typeof categories>();
  for (const category of categories) {
    const key = category.parentId ?? null;
    const group = categoriesByParent.get(key) ?? [];
    group.push(category);
    categoriesByParent.set(key, group);
  }

  const rootCategories = (categoriesByParent.get(null) ?? []).sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  return (
    <main className="w-full space-y-5">
      <section className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure category hierarchy used for spending analytics.
        </p>
      </section>

      <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Add category</h2>
        <form action={createCategoryAction} className="mt-3 grid gap-2 md:grid-cols-3">
          <input
            name="name"
            required
            placeholder="Category name"
            className="h-10 rounded-md border border-indigo-200 bg-white px-3"
          />
          <select name="parentId" defaultValue="" className="h-10 rounded-md border border-indigo-200 bg-white px-3">
            <option value="">No parent (top-level)</option>
            {rootCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button className="h-10 rounded-md bg-indigo-700 px-4 text-sm font-semibold text-white">
            Add category
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/55 p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Category list</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {rootCategories.map((category) => (
            <CategoryChip key={category.id} name={category.name} />
          ))}
        </div>
        <div className="mt-4 space-y-4">
          {rootCategories.map((category) => (
            <article key={category.id} className="rounded-xl border border-amber-200 bg-white/80 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryChip name={category.name} />
                <form action={updateCategoryAction} className="flex flex-1 items-center gap-2">
                  <input type="hidden" name="id" value={category.id} />
                  <input
                    name="name"
                    defaultValue={category.name}
                    className="h-9 flex-1 rounded-md border border-amber-200 bg-white px-3 text-sm"
                  />
                  <button className="h-9 rounded-md border border-amber-300 bg-amber-100 px-3 text-sm text-amber-900">
                    Save
                  </button>
                </form>
                <ReorderButtons id={category.id} />
                <DeleteButton id={category.id} />
              </div>

              <div className="mt-3 space-y-2 pl-3">
                {(categoriesByParent.get(category.id) ?? [])
                  .sort((left, right) => left.sortOrder - right.sortOrder)
                  .map((child) => (
                    <div key={child.id} className="rounded-md border border-amber-100 bg-white p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CategoryChip name={child.name} />
                        <form action={updateCategoryAction} className="flex flex-1 items-center gap-2">
                          <input type="hidden" name="id" value={child.id} />
                          <input
                            name="name"
                            defaultValue={child.name}
                            className="h-8 flex-1 rounded-md border border-amber-200 bg-white px-3 text-sm"
                          />
                          <button className="h-8 rounded-md border border-amber-300 bg-amber-100 px-3 text-xs text-amber-900">
                            Save
                          </button>
                        </form>
                        <ReorderButtons id={child.id} />
                        <DeleteButton id={child.id} />
                      </div>
                    </div>
                  ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function DeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteCategoryAction}>
      <input type="hidden" name="id" value={id} />
      <button className="h-9 rounded-md border border-rose-300 bg-rose-50 px-3 text-sm text-rose-700">
        Delete
      </button>
    </form>
  );
}

function ReorderButtons({ id }: { id: string }) {
  return (
    <div className="flex gap-1">
      <form action={moveCategoryAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="up" />
        <button className="h-9 rounded-md border border-amber-300 bg-white px-2 text-xs">Up</button>
      </form>
      <form action={moveCategoryAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="down" />
        <button className="h-9 rounded-md border border-amber-300 bg-white px-2 text-xs">Down</button>
      </form>
    </div>
  );
}
